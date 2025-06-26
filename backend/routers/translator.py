from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import os
import numpy as np
from tensorflow.keras.models import load_model
import logging

from translator.video_mapper import GLOSS_VIDEO_MAP, VIDEO_ID_TO_PATH
from translator.glossizer import glossize

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the API router
router = APIRouter(prefix="/translator", tags=["translator"])

# --- Gloss-related Endpoints ---

@router.post("/api/gloss")
async def get_gloss(request: Request):
    data = await request.json()
    sentence = data.get("sentence", "")
    gloss = glossize(sentence)
    return {"input": sentence, "gloss": gloss}


@router.post("/gloss-videos/")
async def get_gloss_videos(request: Request):
    data = await request.json()
    sentence = data.get("sentence", "").strip()
    if not sentence:
        return {"glosses": [], "videos": []}

    gloss_string = glossize(sentence)
    glosses = gloss_string.split()

    video_ids = []
    for gloss in glosses:
        videos = GLOSS_VIDEO_MAP.get(gloss.upper())
        if videos:
            video_path = videos[0]
            video_id = os.path.splitext(os.path.basename(video_path))[0]
            video_ids.append(video_id)
        else:
            video_ids.append(None)

    return {"glosses": glosses, "videos": video_ids}


@router.get("/video/{video_id}")
def serve_video(video_id: str):
    path = VIDEO_ID_TO_PATH.get(video_id)
    if path and os.path.exists(path):
        return FileResponse(path, media_type="video/mp4")
    raise HTTPException(status_code=404, detail="Video not found")


# --- ASL Model Inference Endpoint ---

# Load model and config on module load
try:
  

    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'translator'))


    model = load_model(os.path.join(BASE_DIR, "asl_model_reduced.h5"), compile=False)
    actions = np.load(os.path.join(BASE_DIR, "classes_reduced.npy"), allow_pickle=True)
    train_median = np.load(os.path.join(BASE_DIR, "train_median_reduced.npy"))
    train_iqr = np.load(os.path.join(BASE_DIR, "train_iqr_reduced.npy"))

except FileNotFoundError as e:
    logger.error(f"Model load error: {e}")
    raise RuntimeError(f"Missing model file: {e}") from e


class Landmark(BaseModel):
    x: float
    y: float
    z: float
    visibility: float = 0.0


class LandmarkSequence(BaseModel):
    sequence: List[List[Landmark]]


SEQUENCE_LENGTH = 30
PREDICTION_THRESHOLD = 0.3
CONFIDENCE_DELTA = 0.15
EXPECTED_LANDMARKS_PER_FRAME = 53
EXPECTED_FEATURES_PER_FRAME = 170


def process_prediction(sequence_data: np.ndarray):
    if sequence_data.shape[0] != SEQUENCE_LENGTH:
        return None, 0.0

    input_data = (sequence_data - train_median) / (train_iqr + 1e-8)
    input_data = np.expand_dims(input_data, axis=0)

    res = model.predict(input_data, verbose=0)[0]
    top_indices = np.argsort(res)[-2:]
    top_confidences = res[top_indices]

    if (
        top_confidences[-1] > PREDICTION_THRESHOLD
        and (top_confidences[-1] - top_confidences[-2]) > CONFIDENCE_DELTA
    ):
        predicted_action = actions[top_indices[-1]]
        confidence = top_confidences[-1]
        return predicted_action, float(confidence)

    return None, 0.0


@router.post("/predict")
async def predict(landmark_data: LandmarkSequence):
    if not landmark_data.sequence or len(landmark_data.sequence) != SEQUENCE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sequence length. Expected {SEQUENCE_LENGTH}, got {len(landmark_data.sequence)}",
        )

    try:
        sequence_array = []
        for frame_idx, frame_landmarks in enumerate(landmark_data.sequence):
            if len(frame_landmarks) != EXPECTED_LANDMARKS_PER_FRAME:
                raise HTTPException(
                    status_code=400,
                    detail=f"Frame {frame_idx}: Expected {EXPECTED_LANDMARKS_PER_FRAME} landmarks, got {len(frame_landmarks)}",
                )

            frame_points = []
            for i, lm in enumerate(frame_landmarks):
                if i < 11:
                    frame_points.extend([lm.x, lm.y, lm.z, lm.visibility])
                else:
                    frame_points.extend([lm.x, lm.y, lm.z])

            sequence_array.append(frame_points)

        sequence_np = np.array(sequence_array, dtype=np.float32)

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
        raise HTTPException(status_code=500, detail="Error processing the landmark data.")
