import os
import cv2
import mediapipe as mp
import numpy as np
import csv

# Init holistic model
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(static_image_mode=True)
mp_drawing = mp.solutions.drawing_utils

# Paths
data_dir = "dataset"
output_csv = "landmarks.csv"

# Feature lengths
POSE_LEN = 132
FACE_LEN = 1404
HAND_LEN = 63  # per hand
TOTAL_FEATURES = POSE_LEN + FACE_LEN + 2 * HAND_LEN  # = 1662

# Flatten helpers
def flatten_pose(pose_landmarks):
    if pose_landmarks:
        vals = [c for lm in pose_landmarks.landmark[:33] for c in (lm.x, lm.y, lm.z, lm.visibility)]
        return np.pad(vals, (0, POSE_LEN - len(vals)), constant_values=0.0)
    return np.zeros(POSE_LEN)

def flatten_face(face_landmarks):
    if face_landmarks:
        vals = [c for lm in face_landmarks.landmark[:468] for c in (lm.x, lm.y, lm.z)]
        return np.pad(vals, (0, FACE_LEN - len(vals)), constant_values=0.0)
    return np.zeros(FACE_LEN)

def flatten_hand(hand_landmarks):
    if hand_landmarks:
        vals = [c for lm in hand_landmarks.landmark[:21] for c in (lm.x, lm.y, lm.z)]
        return np.pad(vals, (0, HAND_LEN - len(vals)), constant_values=0.0)
    return np.zeros(HAND_LEN)

# Write to CSV
with open(output_csv, 'w', newline='') as f:
    writer = csv.writer(f)
    header = [f"f{i}" for i in range(TOTAL_FEATURES)] + ["label"]
    writer.writerow(header)

    for label in os.listdir(data_dir):
        label_dir = os.path.join(data_dir, label)
        if not os.path.isdir(label_dir):
            continue

        for img_name in os.listdir(label_dir):
            img_path = os.path.join(label_dir, img_name)
            image = cv2.imread(img_path)
            if image is None:
                continue

            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = holistic.process(image_rgb)

            pose_vec = flatten_pose(results.pose_landmarks)
            face_vec = flatten_face(results.face_landmarks)
            lh_vec = flatten_hand(results.left_hand_landmarks)
            rh_vec = flatten_hand(results.right_hand_landmarks)

            feature_vector = np.concatenate([pose_vec, face_vec, lh_vec, rh_vec])

            if feature_vector.shape[0] != TOTAL_FEATURES:
                print(f"Skipping {img_path}: invalid shape {feature_vector.shape[0]}")
                continue

            writer.writerow(feature_vector.tolist() + [label])
