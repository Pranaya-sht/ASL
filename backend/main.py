# from fastapi import UploadFile, File, FastAPI
# import numpy as np
# import cv2
# import joblib
# import mediapipe as mp
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from fastapi import FastAPI
# from routers import users  # make sure __init__.py exists in the routers/ folder


# app= FastAPI()
# app.include_router(users.router)


# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Adjust this to restrict origins in production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# model = joblib.load("landmark_model.pkl")
# mp_hands = mp.solutions.hands
# hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1)

# class LandmarkInput(BaseModel):
#     landmarks: list[float]  # or list[Any] if you want to be more lenient

# @app.post("/predict")
# async def predict(data: LandmarkInput):
#     # First 21 are x, next 21 are y
#     x_coords = data.landmarks[0:21]
#     y_coords = data.landmarks[21:42]

#     input_data = np.array(x_coords + y_coords).reshape(1, -1)
#     prediction = model.predict(input_data)[0]
#     return {"prediction": prediction}


from fastapi import FastAPI, Depends, HTTPException, status
from routers import users
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
load_dotenv()

app = FastAPI()

# Register routers
app.include_router(users.router)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and setup MediaPipe
model = joblib.load("landmark_model.pkl")
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1)

# Input schema
class LandmarkInput(BaseModel):
    landmarks: list[float]  # or list[Any] if you want to be more lenient

# ASL Prediction endpoint (secured)
@app.post("/predict")
async def predict(data: LandmarkInput,user: User = Depends(get_current_user)):
    # Ensure the user is authenticated (current_user is injected by get_current_user)
    x_coords = data.landmarks[0:21]
    y_coords = data.landmarks[21:42]

    input_data = np.array(x_coords + y_coords).reshape(1, -1)
    prediction = model.predict(input_data)[0]
    return {"prediction": prediction}
