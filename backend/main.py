from fastapi import FastAPI, Depends, HTTPException, status
from routers import users,learn
from fastapi import UploadFile, File
from pydantic import BaseModel, conlist
import numpy as np
import joblib
import mediapipe as mp
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from auth import get_current_user
from database import get_db
from models import User  # Add this import for User
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
import os

load_dotenv()

app = FastAPI()

# Register routers
app.include_router(users.router)
app.include_router(learn.router)
# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load model and setup MediaPipe
model = joblib.load("landmark_model.pkl")
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1)

# Input schema
class LandmarkInput(BaseModel):
    landmarks: list[float]

# Analytics schema for response
class AnalyticsResponse(BaseModel):
    lessons_completed: int
    words_learned: int
    total_learning_minutes: int
    total_predictions: int
    total_translations: int

    class Config:
        orm_mode = True

# ASL Prediction endpoint (secured)
@app.post("/predict")
async def predict(
    data: LandmarkInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Extract coordinates from landmarks
    x_coords = data.landmarks[0:21]
    y_coords = data.landmarks[21:42]

    input_data = np.array(x_coords + y_coords).reshape(1, -1)
    prediction = model.predict(input_data)[0]

    # Update analytics for current user
    user.total_predictions = (user.total_predictions or 0) + 1
    db.commit()
    db.refresh(user)

    analytics = AnalyticsResponse(
        lessons_completed=user.lessons_completed,
        words_learned=user.words_learned,
        total_learning_minutes=user.total_learning_minutes,
        total_predictions=user.total_predictions,
        total_translations=user.total_translations
    )

    return {
        "prediction": prediction,
        "analytics": analytics
    }
