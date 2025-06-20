import os
import cv2
import mediapipe as mp
import numpy as np
import csv

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.7)
mp_drawing = mp.solutions.drawing_utils

data_dir = "dataset"
output_csv = "landmarks.csv"

with open(output_csv, 'w', newline='') as f:
    writer = csv.writer(f)
    header = [f"x{i}" for i in range(21)] + [f"y{i}" for i in range(21)] + [f"z{i}" for i in range(21)] + ["label"]
    writer.writerow(header)

    for label in os.listdir(data_dir):
        for img_name in os.listdir(os.path.join(data_dir, label)):
            img_path = os.path.join(data_dir, label, img_name)
            image = cv2.imread(img_path)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = hands.process(image_rgb)

            if results.multi_hand_landmarks:
                landmarks = results.multi_hand_landmarks[0]
                x = [lm.x for lm in landmarks.landmark]
                y = [lm.y for lm in landmarks.landmark]
                z = [lm.z for lm in landmarks.landmark]

                # Normalize coordinates
                x0, y0 = x[0], y[0]
                x = [i - x0 for i in x]
                y = [i - y0 for i in y]

                writer.writerow(x + y + z + [label])
