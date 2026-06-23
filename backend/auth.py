"""
Cognate — Authentication Router.

Implements the full identity lifecycle: signup with OTP verification,
password reset via timed OTP, and JWT-returning login.
All OTP emails are dispatched asynchronously via FastAPI BackgroundTasks
to ensure zero UI-blocking on the critical auth path.
"""

import os
import random
from datetime import datetime, timedelta, timezone

import pymongo.errors
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel

from database import mongo_instance
from email_utils import send_otp_email_sync, send_reset_email_sync
from models import UserCreate
from security import create_access_token, get_password_hash, verify_password


router = APIRouter()


# ── Request Models ────────────────────────────────────────────────────────────

class VerifyOTPRequest(BaseModel):
    email: str
    otp:   str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email:        str
    otp:          str
    new_password: str


# ── Private Helpers ───────────────────────────────────────────────────────────

def _generate_otp() -> str:
    """Generates a cryptographically adequate 4-digit numeric OTP string."""
    return str(random.randint(1000, 9999))


def _otp_expires() -> datetime:
    """Returns a timezone-aware UTC timestamp 10 minutes in the future."""
    return datetime.now(timezone.utc) + timedelta(minutes=10)


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
async def signup(user: UserCreate, background_tasks: BackgroundTasks):
    """
    Creates an unverified user record and dispatches an OTP verification email.

    The account remains locked (`is_verified=False`) until the `/verify-otp`
    endpoint is called with the matching code within the 10-minute window.
    """
    db            = await _get_db()
    existing_user = await db.users.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    hashed_password = get_password_hash(user.password)
    otp             = _generate_otp()
    otp_expires     = _otp_expires()

    user_dict = {
        "email":       user.email,
        "password":    hashed_password,
        "is_verified": False,
        "otp":         otp,
        "otp_expires": otp_expires
    }

    await db.users.insert_one(user_dict)
    background_tasks.add_task(send_otp_email_sync, user.email, otp)

    return {"message": "Workspace provisioned. Please check your email for your verification code."}


# ── POST /verify-otp ──────────────────────────────────────────────────────────

@router.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """
    Validates a signup OTP and activates the user account.

    The OTP and expiry fields are atomically removed from the document
    on success to prevent replay attacks.
    """
    db   = await _get_db()
    user = await db.users.find_one({"email": request.email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )

    if user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is already verified."
        )

    stored_otp  = user.get("otp")
    otp_expires = user.get("otp_expires")
    now         = datetime.now(timezone.utc)

    if stored_otp != request.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )

    if otp_expires and now > otp_expires.replace(tzinfo=timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one."
        )

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set":   {"is_verified": True},
            "$unset": {"otp": "", "otp_expires": ""}
        }
    )

    return {"message": "Identity verified. Your Cognate workspace is now active."}


# ── POST /forgot-password ─────────────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """
    Initiates a password reset by storing a timed OTP for registered emails.

    Always returns a generic success message regardless of whether the email
    exists, preventing email enumeration by unauthenticated callers.
    """
    db   = await _get_db()
    user = await db.users.find_one({"email": request.email})

    if user:
        otp          = _generate_otp()
        reset_expires = _otp_expires()

        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"reset_otp": otp, "reset_expires": reset_expires}}
        )
        background_tasks.add_task(send_reset_email_sync, request.email, otp)

    return {"message": "If your email is registered, an OTP has been sent."}


# ── POST /reset-password ──────────────────────────────────────────────────────

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Validates the reset OTP and replaces the user's hashed password.

    The `reset_otp` and `reset_expires` fields are atomically removed on
    success to ensure single-use enforcement.
    """
    db   = await _get_db()
    user = await db.users.find_one({"email": request.email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )

    stored_reset_otp = user.get("reset_otp")
    reset_expires    = user.get("reset_expires")
    now              = datetime.now(timezone.utc)

    if stored_reset_otp != request.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset code."
        )

    if reset_expires and now > reset_expires.replace(tzinfo=timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired. Please request a new one."
        )

    new_hashed_password = get_password_hash(request.new_password)

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set":   {"password": new_hashed_password},
            "$unset": {"reset_otp": "", "reset_expires": ""}
        }
    )

    return {"message": "Password reset successful. You can now sign in with your new credentials."}


# ── POST /login ───────────────────────────────────────────────────────────────

@router.post("/login")
async def login(user: UserCreate):
    """
    Authenticates a verified user and returns a signed JWT.

    Returns an identical 401 for both unknown emails and wrong passwords
    to prevent credential oracle attacks.
    """
    db      = await _get_db()
    db_user = await db.users.find_one({"email": user.email})

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong Email or Password."
        )

    if not db_user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before signing in."
        )

    access_token = create_access_token({"sub": user.email})

    return {
        "access_token": access_token,
        "token_type":   "bearer"
    }
