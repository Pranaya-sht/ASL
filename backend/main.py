# main.py
# To run this:
# 1. Install necessary packages: pip install fastapi uvicorn "python-multipart" "numpy" "tensorflow" "scikit-learn"
# 2. Make sure your model files (asl_model_reduced.h5, classes_reduced.npy, etc.) are in the same directory.
# 3. Run the server from your terminal: uvicorn main:app --reload

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np
from tensorflow.keras.models import load_model
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# --- Add CORS Middleware ---
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Model and Configuration Loading ---
try:
    model = load_model("asl_model_reduced.h5", compile=False)
    actions = np.load("classes_reduced.npy", allow_pickle=True)
    train_median = np.load("train_median_reduced.npy")
    train_iqr = np.load("train_iqr_reduced.npy")
    logger.info("Model and configuration loaded successfully")
except FileNotFoundError as e:
    logger.error(f"Model loading error: {e}")
    raise RuntimeError(f"Could not find a necessary model file: {e}") from e


# --- Pydantic Models for Request Body ---
class Landmark(BaseModel):
    x: float
    y: float
    z: float
    visibility: float = 0.0


class LandmarkSequence(BaseModel):
    sequence: List[List[Landmark]]


# --- Prediction Logic ---
SEQUENCE_LENGTH = 30
PREDICTION_THRESHOLD = 0.3
CONFIDENCE_DELTA = 0.15
EXPECTED_LANDMARKS_PER_FRAME = 53  # 11 pose + 21 left hand + 21 right hand
EXPECTED_FEATURES_PER_FRAME = 170  # 11*4 + 21*3 + 21*3


def process_prediction(sequence_data: np.ndarray):
    """
    Takes a sequence of landmarks, scales it, and returns a prediction if confidence is high.
    """
    if sequence_data.shape[0] != SEQUENCE_LENGTH:
        return None, 0.0

    # Robust scaling using the pre-calculated median and IQR
    input_data = (sequence_data - train_median) / (train_iqr + 1e-8)
    input_data = np.expand_dims(input_data, axis=0)

    # Get prediction from the model
    res = model.predict(input_data, verbose=0)[0]

    top_indices = np.argsort(res)[-2:]  # Get top 2 predictions
    top_confidences = res[top_indices]

    # Check if the top prediction is confident enough and significantly better than the second
    if (
        top_confidences[-1] > PREDICTION_THRESHOLD
        and (top_confidences[-1] - top_confidences[-2]) > CONFIDENCE_DELTA
    ):
        predicted_action = actions[top_indices[-1]]
        confidence = top_confidences[-1]
        return predicted_action, float(confidence)

    return None, 0.0


@app.post("/predict")
async def predict(landmark_data: LandmarkSequence):
    """
    API endpoint to receive a sequence of landmarks and return a sign language prediction.
    """
    if not landmark_data.sequence or len(landmark_data.sequence) != SEQUENCE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sequence length. Expected {SEQUENCE_LENGTH}, got {len(landmark_data.sequence)}",
        )

    try:
        sequence_array = []
        for frame_idx, frame_landmarks in enumerate(landmark_data.sequence):
            # Validate number of landmarks per frame
            if len(frame_landmarks) != EXPECTED_LANDMARKS_PER_FRAME:
                raise HTTPException(
                    status_code=400,
                    detail=f"Frame {frame_idx}: Expected {EXPECTED_LANDMARKS_PER_FRAME} landmarks, got {len(frame_landmarks)}",
                )

            frame_points = []
            # Process each landmark based on its position
            for i, lm in enumerate(frame_landmarks):
                if i < 11:  # Pose landmarks (0-10)
                    frame_points.extend([lm.x, lm.y, lm.z, lm.visibility])
                else:  # Hand landmarks (11-52)
                    frame_points.extend([lm.x, lm.y, lm.z])

            sequence_array.append(frame_points)

        # Convert to numpy array
        sequence_np = np.array(sequence_array, dtype=np.float32)

        # Final feature count validation
        if sequence_np.shape[1] != EXPECTED_FEATURES_PER_FRAME:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid features per frame. Expected {EXPECTED_FEATURES_PER_FRAME}, got {sequence_np.shape[1]}",
            )

        predicted_action, confidence = process_prediction(sequence_np)

        if predicted_action:
            return {"prediction": predicted_action, "confidence": confidence}
        else:
            return {"prediction": None, "confidence": 0.0}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="Error processing the landmark data."
        )


@app.get("/")
def read_root():
    return {"message": "ASL Prediction Server is running."}
