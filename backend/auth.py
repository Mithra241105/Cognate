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


# ── POST /login ───────────────────────────────────────────────────────────────

@router.post("/login")
async def login(user: UserCreate):
    """
    Unified Authentication Endpoint:
    If the email exists, verify the password and log them in.
    If the email does NOT exist, create the account and log them in directly.
    """
    db      = await _get_db()
    db_user = await db.users.find_one({"email": user.email})

    if not db_user:
        # Create new account
        hashed_password = get_password_hash(user.password)
        user_dict = {
            "email":       user.email,
            "password":    hashed_password
        }
        await db.users.insert_one(user_dict)
    else:
        # Verify existing account password
        if not verify_password(user.password, db_user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Wrong Email or Password."
            )

    access_token = create_access_token({"sub": user.email})

    return {
        "access_token": access_token,
        "token_type":   "bearer"
    }
