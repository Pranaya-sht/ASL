from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import models, database, schemas

from auth import get_current_user
from schemas import (
    UserCreate, UserOut, Token, UserLogin, UserUpdate,
    UserProfileResponse, Analytics, PredictionCreate
)
from crud import create_user, get_user_by_email
from database import get_db
from utils import verify_password, create_access_token
from auth import get_current_user
from models import User

import os
from uuid import uuid4

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

UPLOAD_DIR = "static/uploads"


# ✅ Register new user
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    new_user = create_user(db, user)
    return new_user


# ✅ Login existing user
@router.post("/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# ✅ Fetch current user profile (GET)
@router.get("/me", response_model=UserProfileResponse)
def get_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analytics = Analytics(
        lessons_completed=current_user.lessons_completed,
        words_learned=current_user.words_learned,
        total_learning_minutes=current_user.total_learning_minutes,
        total_predictions=current_user.total_predictions,
        total_translations=current_user.total_translations
    )
    return {"user": current_user, "analytics": analytics}

# ✅ Update user profile (PUT)
@router.put("/me", response_model=UserProfileResponse)
def update_user_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if update_data.profile_image_url is not None:
        current_user.profile_image_url = update_data.profile_image_url
    if update_data.bio is not None:
        current_user.bio = update_data.bio

    db.commit()
    db.refresh(current_user)

    analytics = Analytics(
        lessons_completed=current_user.lessons_completed,
        words_learned=current_user.words_learned,
        total_learning_minutes=current_user.total_learning_minutes,
        total_predictions=current_user.total_predictions,
        total_translations=current_user.total_translations
    )
    return {"user": current_user, "analytics": analytics}

@router.post("/me/profile-image")
def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure the upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Validate file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(status_code=400, detail="Invalid image format")

    # Create a unique filename
    filename = f"{uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    # Update profile_image_url (for example: /static/uploads/abc123.jpg)
    profile_image_url = f"/{file_path.replace(os.sep, '/')}"  # ensure forward slashes for URLs
    current_user.profile_image_url = profile_image_url

    db.commit()
    db.refresh(current_user)

    return JSONResponse(content={
        "message": "Profile image uploaded successfully",
        "profile_image_url": current_user.profile_image_url
    })
    
@router.post("/api/flashcards/predict")
def save_prediction(prediction: PredictionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_entry = models.FlashcardPrediction(
        user_id=current_user.id,
        prediction=prediction.prediction
    )
    db.add(new_entry)
    current_user.total_predictions += 1  # Optional: if you're tracking
    db.commit()
    db.refresh(new_entry)
    return {"status": "success", "prediction_id": new_entry.id}