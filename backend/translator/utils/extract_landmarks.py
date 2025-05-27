import cv2
import mediapipe as mp
import os
import numpy as np
from tqdm import tqdm

# Initialize MediaPipe Holistic model (includes hands, face, pose)
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils

def extract_landmarks_from_video(video_path):
    cap = cv2.VideoCapture(video_path)
    holistic = mp_holistic.Holistic(static_image_mode=False)

    all_landmarks = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Convert BGR to RGB for MediaPipe
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = holistic.process(image)

        frame_data = []

        # Pose landmarks (33)
        if results.pose_landmarks:
            frame_data.extend([(lm.x, lm.y, lm.z) for lm in results.pose_landmarks.landmark])
        else:
            frame_data.extend([(0, 0, 0)] * 33)

        # Left hand landmarks (21)
        if results.left_hand_landmarks:
            frame_data.extend([(lm.x, lm.y, lm.z) for lm in results.left_hand_landmarks.landmark])
        else:
            frame_data.extend([(0, 0, 0)] * 21)

        # Right hand landmarks (21)
        if results.right_hand_landmarks:
            frame_data.extend([(lm.x, lm.y, lm.z) for lm in results.right_hand_landmarks.landmark])
        else:
            frame_data.extend([(0, 0, 0)] * 21)

        # Face landmarks (we take every 10th point to reduce size: 47 points)
        if results.face_landmarks:
            frame_data.extend([(results.face_landmarks.landmark[i].x,
                                results.face_landmarks.landmark[i].y,
                                results.face_landmarks.landmark[i].z)
                               for i in range(0, 468, 10)])
        else:
            frame_data.extend([(0, 0, 0)] * (468 // 10))  # 47 points

        # Convert to flat array [x1, y1, z1, x2, y2, z2, ...]
        flat = np.array(frame_data).flatten()

        all_landmarks.append(flat)

    cap.release()
    holistic.close()

    # Pad frames to fixed shape
    fixed_length = 366 * 3  # 366 points × 3 values
    padded_landmarks = []

    for frame in all_landmarks:
        if frame.shape[0] < fixed_length:
            pad = np.zeros(fixed_length - frame.shape[0])
            frame = np.concatenate([frame, pad])
        elif frame.shape[0] > fixed_length:
            frame = frame[:fixed_length]
        padded_landmarks.append(frame)

    return np.array(padded_landmarks)


def process_all_videos(video_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    video_files = [f for f in os.listdir(video_dir) if f.endswith(".mp4")]

    for video_file in tqdm(video_files):
        in_path = os.path.join(video_dir, video_file)
        out_path = os.path.join(out_dir, video_file.replace(".mp4", ".npy"))

        if os.path.exists(out_path):
            continue  # Skip already processed

        try:
            landmarks = extract_landmarks_from_video(in_path)
            np.save(out_path, landmarks)
        except Exception as e:
            print(f"Error processing {video_file}: {e}")


if __name__ == "__main__":
    process_all_videos("data/videos", "data/landmarks")
