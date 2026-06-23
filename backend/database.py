"""
Cognate — MongoDB Connection Manager.

Uses the Motor async driver. A module-level singleton is exposed so routers
can acquire a database handle without managing connection state themselves.
The unique index on `users.email` is created idempotently at startup.
"""

import os

import certifi
import pymongo.errors
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()


class MongoSingleton:
    """Holds the single shared Motor client instance for the application lifetime."""
    client: AsyncIOMotorClient = None


mongo_instance = MongoSingleton()


async def connect_mongo():
    """Initializes the Motor client and ensures required collection indexes exist."""
    uri = os.getenv("MONGO_URI")
    if uri:
        mongo_instance.client = AsyncIOMotorClient(
            uri,
            tls=True,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=True
        )
        db = mongo_instance.client.get_database("app_db")
        try:
            await db.users.create_index("email", unique=True)
        except Exception:
            pass


async def disconnect_mongo():
    """Closes the Motor client connection on application shutdown."""
    if mongo_instance.client:
        mongo_instance.client.close()
