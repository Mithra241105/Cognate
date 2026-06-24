"""
Cognate — Security & Authentication Utilities.

Provides password hashing via bcrypt, stateless JWT creation, and a FastAPI
dependency for extracting the authenticated user email from Bearer tokens.
Imports are intentionally split: core crypto helpers are defined first so
`get_current_user` can reference them without a circular import.
"""

import os
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt


SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM  = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_password_hash(password: str) -> str:
    """Returns a bcrypt hash of the supplied plaintext password."""
    # bcrypt requires bytes; truncate to 72 bytes to avoid bcrypt limits
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time comparison of a plaintext password against its stored hash."""
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except ValueError:
        return False


def create_access_token(data: dict) -> str:
    """
    Creates a signed HS256 JWT with a 30-minute expiry.

    The `sub` claim should contain the user's email address, which is
    subsequently extracted by `get_current_user`.
    """
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(minutes=30)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """
    FastAPI dependency that validates a Bearer JWT and returns the subject email.

    Raises HTTP 401 for any token that is missing, malformed, expired, or
    lacking a `sub` claim — without discriminating the failure reason to callers.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return email
