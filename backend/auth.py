"""
Cognate — Authentication Router.

Implements a streamlined identity lifecycle:
Direct signup (no verification needed), direct password resets (no OTPs), and JWT-returning login.
"""

import pymongo.errors
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from database import mongo_instance
from models import UserCreate
from security import create_access_token, get_password_hash, verify_password


router = APIRouter()


# ── Request Models ────────────────────────────────────────────────────────────



# ── Private Helpers ───────────────────────────────────────────────────────────

async def _get_db():
    """
    Acquires the application database handle.

    Raises HTTP 503 if the Atlas cluster is unreachable, surfacing a
    actionable message for operators rather than a raw connection error.
    """
    try:
        return mongo_instance.client.get_database("app_db")
    except pymongo.errors.ServerSelectionTimeoutError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unreachable. Is your IP whitelisted in MongoDB Atlas?"
        )


# ── POST /signup ──────────────────────────────────────────────────────────────

@router.post("/signup")
async def signup(user: UserCreate):
    """
    Creates a user record directly.
    The account is immediately activated.
    """
    db            = await _get_db()
    existing_user = await db.users.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    hashed_password = get_password_hash(user.password)

    user_dict = {
        "email":       user.email,
        "password":    hashed_password
    }

    await db.users.insert_one(user_dict)

    access_token = create_access_token({"sub": user.email})

    return {
        "access_token": access_token,
        "token_type":   "bearer"
    }


# ── POST /login ───────────────────────────────────────────────────────────────

@router.post("/login")
async def login(user: UserCreate):
    """
    Authenticates a user and returns a signed JWT.
    """
    db      = await _get_db()
    db_user = await db.users.find_one({"email": user.email})

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong Email or Password."
        )

    access_token = create_access_token({"sub": user.email})

    return {
        "access_token": access_token,
        "token_type":   "bearer"
    }
