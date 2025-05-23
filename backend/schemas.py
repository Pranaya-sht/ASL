from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    lessons_completed: int
    words_learned: int
    total_learning_minutes: int

    class Config:
        orm_mode = True
        
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# schemas.py

class Analytics(BaseModel):
    lessons_completed: int
    words_learned: int
    total_learning_minutes: int
    total_predictions: int
    total_translations: int

class UserProfileResponse(BaseModel):
    user: UserOut
    analytics: Analytics

class UserUpdate(BaseModel):
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None



class PredictionCreate(BaseModel):
    prediction: str
