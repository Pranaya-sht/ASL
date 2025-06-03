from fastapi import FastAPI, Depends, HTTPException, status
from routers import users,learn
from fastapi import UploadFile, File,Request
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
from typing import List,Dict,Any
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from tensorflow.keras.models import load_model
import os
import logging
from collections import deque

sequence_buffer = deque(maxlen=30)

load_dotenv()

app = FastAPI()


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Register routers
app.include_router(users.router)
app.include_router(learn.router)
# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)
#os.makedirs("static/uploads", exist_ok=True)
#app.mount("/static", StaticFiles(directory="static"), name="static")

# Load model and setup MediaPipe
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(static_image_mode=True)
mp_drawing = mp.solutions.drawing_utils

try:
    model = load_model('asl_model.h5')
    actions = np.load('classes.npy')
    logger.info("Model and classes loaded successfully")
except Exception as e:
    logger.error(f"Error loading model/classes: {str(e)}")
    raise RuntimeError("Model initialization failed")

threshold = 0.8


# Input schema
class LandmarkInput(BaseModel):
    landmarks: Dict[str,List[Dict[str,float]]]

# Analytics schema for response
class AnalyticsResponse(BaseModel):
    lessons_completed: int
    words_learned: int
    total_learning_minutes: int
    total_predictions: int
    total_translations: int

    #class Config:
     #   orm_mode = True
      #  model = joblib.load("landmark_model.pkl")
    #label_encoder = joblib.load("label_encoder.pkl")   # numeric ⇄ string labels

POSE_LEN, FACE_LEN, HAND_LEN = 132, 1404, 63       # per earlier discussion

# ASL Prediction endpoint (secured)
@app.post("/predict")
async def predict(
    request:Request,
    data: LandmarkInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    
):
    try:
        data = await request.json()
        landmarks = data.get('landmarks', {})
        
        # Extract and validate landmarks
        pose = np.array([[lm.get('x', 0), lm.get('y', 0), lm.get('z', 0), lm.get('visibility', 0)] 
                        for lm in landmarks.get('pose', [])]).flatten() if landmarks.get('pose') else np.zeros(33*4)
        face = np.array([[lm.get('x', 0), lm.get('y', 0), lm.get('z', 0)] 
                        for lm in landmarks.get('face', [])]).flatten() if landmarks.get('face') else np.zeros(468*3)
        lh = np.array([[lm.get('x', 0), lm.get('y', 0), lm.get('z', 0)] 
                      for lm in landmarks.get('leftHand', [])]).flatten() if landmarks.get('leftHand') else np.zeros(21*3)
        rh = np.array([[lm.get('x', 0), lm.get('y', 0), lm.get('z', 0)] 
                      for lm in landmarks.get('rightHand', [])]).flatten() if landmarks.get('rightHand') else np.zeros(21*3)
        
        # Concatenate keypoints
        keypoints = np.concatenate([pose, face, lh, rh])
        sequence_buffer.append(keypoints)
        if len(sequence_buffer) < 30:
            return {"prediction": "⌛"}  # Not enough data yet

        sequence = np.expand_dims(sequence_buffer, axis=0)  # (1, 30, 1692)
        sequence = sequence[:, :, :1662]  # Trim to expected 1662 if needed
 # Add batch dimension
        
        # Make prediction
        res = model.predict(sequence)[0]
        if np.max(res) > threshold:
            prediction = actions[np.argmax(res)]
            return {"prediction": prediction}
        return {"prediction": "❓"}
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Prediction failed")
