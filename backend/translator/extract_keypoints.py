import cv2
import mediapipe as mp
import os
import json
from tqdm import tqdm

# Setup MediaPipe Holistic with HIGH ACCURACY settings
mp_holistic = mp.solutions.holistic

# Drawing (optional - use for debug/visualization)
mp_drawing = mp.solutions.drawing_utils

# Paths
VIDEO_DIR = "./raw_videos"  # Input videos
OUTPUT_DIR = "./keypoints"  # Output JSONs
os.makedirs(OUTPUT_DIR, exist_ok=True)


def extract_landmarks_from_video(video_path):
    cap = cv2.VideoCapture(video_path)
    all_landmarks = []

    with mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=2,  # HIGH accuracy
        refine_face_landmarks=True,
        enable_segmentation=False,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.7
    ) as holistic:

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            # Convert to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = holistic.process(frame_rgb)

            frame_data = {
                "pose": [],
                "left_hand": [],
                "right_hand": [],
                "face": []
            }

            # Pose landmarks
            if results.pose_landmarks:
                frame_data["pose"] = [[lm.x, lm.y, lm.z] for lm in results.pose_landmarks.landmark]

            # Left hand
            if results.left_hand_landmarks:
                frame_data["left_hand"] = [[lm.x, lm.y, lm.z] for lm in results.left_hand_landmarks.landmark]

            # Right hand
            if results.right_hand_landmarks:
                frame_data["right_hand"] = [[lm.x, lm.y, lm.z] for lm in results.right_hand_landmarks.landmark]

            # Face
            if results.face_landmarks:
                frame_data["face"] = [[lm.x, lm.y, lm.z] for lm in results.face_landmarks.landmark]

            all_landmarks.append(frame_data)

    cap.release()
    return all_landmarks


# Process each video
for video_file in tqdm(os.listdir(VIDEO_DIR)):
    if not video_file.endswith(".mp4"):
        continue

    input_path = os.path.join(VIDEO_DIR, video_file)
    output_path = os.path.join(OUTPUT_DIR, video_file.replace(".mp4", ".json"))

    try:
        keypoints = extract_landmarks_from_video(input_path)
        with open(output_path, "w") as f:
            json.dump(keypoints, f)
    except Exception as e:
        print(f"❌ Error processing {video_file}: {e}")
