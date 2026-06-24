from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    email: str
    display_name: str | None = None

class ProfileUpdate(BaseModel):
    display_name: str
