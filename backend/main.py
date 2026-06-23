"""
Cognate — FastAPI Application Entry Point.

Bootstraps the ASGI application, registers middleware, and mounts routers.
Lifespan context manages MongoDB connection lifecycle.
"""

import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from auth import router as auth_router
from classifier import initialize_cognitive_centroids, initialize_topic_centroids
from database import connect_mongo, disconnect_mongo
from ml_engine import VectorEngine
from questions_router import router as questions_api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages startup and teardown of shared application resources.

    On startup: connects to MongoDB, instantiates the VectorEngine singleton,
    and pre-computes topic and cognitive centroid embeddings onto app.state.

    The centroid initialization is offloaded to a thread pool via
    asyncio.to_thread because SentenceTransformer.encode() is a blocking
    CPU-bound call. Running it directly on the event loop blocks asyncio's
    internal heartbeat, causing CancelledError cascades during startup.
    """
    await connect_mongo()
    app.state.vector_engine = VectorEngine()
    await asyncio.to_thread(initialize_topic_centroids, app.state)
    await asyncio.to_thread(initialize_cognitive_centroids, app.state)
    yield
    await disconnect_mongo()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.getenv("PRODUCTION_ORIGIN", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Returns a structured JSON error envelope for all HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code":    exc.status_code,
                "message": exc.detail
            }
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catches unhandled exceptions to prevent raw tracebacks leaking to clients."""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code":    500,
                "message": "Internal server error"
            }
        }
    )


@app.get("/health", tags=["Monitoring"])
async def check_health():
    """
    Zero-wake health probe for external uptime monitors.

    Returns an instant HTTP 200 without touching the database or ML engine,
    ensuring sub-5ms response times to satisfy free-tier ping constraints.
    """
    return {"status": "active", "models_loaded": "lazy"}


app.include_router(auth_router)
app.include_router(
    questions_api_router,
    prefix="/api",
    tags=["Questions"]
)
