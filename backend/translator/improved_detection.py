import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.models import load_model
from collections import deque
import time

# Load model and class names
model = load_model("asl_model.h5", compile=False)
actions = np.load("classes.npy")
training_mean = np.load("training_mean.npy")
training_std = np.load("training_std.npy")

# Setup mediapipe
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Configuration
SEQUENCE_LENGTH = 30
FACE_SELECTION = [10, 33, 61, 105, 133, 152, 159, 191, 263, 291, 323, 356, 386]
PREDICTION_THRESHOLD = 0.7
CONFIDENCE_DELTA = 0.15
CONFIDENCE_WINDOW = 15
COOLDOWN_FRAMES = 20
MIN_DETECTION_CONFIDENCE = 0.6
MIN_TRACKING_CONFIDENCE = 0.6

# Prediction buffers
prediction_queue = deque(maxlen=CONFIDENCE_WINDOW)
confidence_history = deque(maxlen=CONFIDENCE_WINDOW)
current_action = ""
cooldown_counter = 0

# Sequence buffer
sequence = deque(maxlen=SEQUENCE_LENGTH)

# FPS tracking
fps_counter = 0
start_time = time.time()

# Display controls
show_landmarks = True
hand_detected = False
hand_detection_time = 0


def mediapipe_detection(image, model):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image.flags.writeable = False
    results = model.process(image)
    image.flags.writeable = True
    return cv2.cvtColor(image, cv2.COLOR_RGB2BGR), results


def draw_landmarks(image, results):
    if results.face_landmarks:
        mp_drawing.draw_landmarks(
            image, results.face_landmarks,
            mp_holistic.FACEMESH_TESSELATION,
            landmark_drawing_spec=None,
            connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style(),
        )
    if results.pose_landmarks:
        mp_drawing.draw_landmarks(
            image, results.pose_landmarks,
            mp_holistic.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style(),
        )
    if results.left_hand_landmarks:
        mp_drawing.draw_landmarks(
            image, results.left_hand_landmarks,
            mp_holistic.HAND_CONNECTIONS,
            mp_drawing_styles.get_default_hand_landmarks_style(),
            mp_drawing_styles.get_default_hand_connections_style(),
        )
    if results.right_hand_landmarks:
        mp_drawing.draw_landmarks(
            image, results.right_hand_landmarks,
            mp_holistic.HAND_CONNECTIONS,
            mp_drawing_styles.get_default_hand_landmarks_style(),
            mp_drawing_styles.get_default_hand_connections_style(),
        )


def extract_keypoints(results):
    keypoints = []

    if results.pose_landmarks:
        for res in results.pose_landmarks.landmark:
            keypoints.extend([res.x, res.y, res.z, res.visibility])
    else:
        keypoints.extend([0] * 33 * 4)

    if results.face_landmarks:
        for i, res in enumerate(results.face_landmarks.landmark):
            if i in FACE_SELECTION:
                keypoints.extend([res.x, res.y, res.z])
    else:
        keypoints.extend([0] * len(FACE_SELECTION) * 3)

    if results.left_hand_landmarks:
        for res in results.left_hand_landmarks.landmark:
            keypoints.extend([res.x, res.y, res.z])
    else:
        keypoints.extend([0] * 21 * 3)

    if results.right_hand_landmarks:
        for res in results.right_hand_landmarks.landmark:
            keypoints.extend([res.x, res.y, res.z])
    else:
        keypoints.extend([0] * 21 * 3)

    return np.array(keypoints)


cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise IOError("Cannot open webcam")

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

with mp_holistic.Holistic(
    min_detection_confidence=MIN_DETECTION_CONFIDENCE,
    min_tracking_confidence=MIN_TRACKING_CONFIDENCE,
    model_complexity=1
) as holistic:

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Frame capture failed.")
            continue

        frame = cv2.flip(frame, 1)
        image, results = mediapipe_detection(frame, holistic)

        current_time = time.time()
        if results.left_hand_landmarks or results.right_hand_landmarks:
            hand_detected = True
            hand_detection_time = current_time
        elif current_time - hand_detection_time > 2.0:
            hand_detected = False

        keypoints = extract_keypoints(results)
        sequence.append(keypoints)

        if len(sequence) == SEQUENCE_LENGTH and hand_detected:
            input_data = (np.array(sequence) - training_mean) / (training_std + 1e-8)
            input_data = np.expand_dims(input_data, axis=0)

            res = model.predict(input_data, verbose=0)[0]
            top_idx = np.argsort(res)[-2:]
            top_actions = actions[top_idx]
            top_confidences = res[top_idx]
            confidence_delta = top_confidences[-1] - top_confidences[-2]

            print(f"Top predictions: {top_actions}, Confidences: {top_confidences}")

            if top_confidences[-1] > PREDICTION_THRESHOLD and confidence_delta > CONFIDENCE_DELTA:
                prediction_queue.append(top_idx[-1])
                confidence_history.append(top_confidences[-1])

                most_common = max(set(prediction_queue), key=prediction_queue.count)
                avg_confidence = np.mean(
                    [c for i, c in zip(prediction_queue, confidence_history) if i == most_common]
                )

                if avg_confidence > PREDICTION_THRESHOLD:
                    predicted_action = actions[most_common]
                    if predicted_action != current_action:
                        cooldown_counter += 1
                        if cooldown_counter >= COOLDOWN_FRAMES:
                            current_action = predicted_action
                            cooldown_counter = 0
                    else:
                        cooldown_counter = 0
            else:
                current_action = ""
                cooldown_counter = 0
        else:
            current_action = ""
            cooldown_counter = 0

        # FPS
        fps_counter += 1
        elapsed_time = time.time() - start_time
        if elapsed_time >= 1.0:
            fps = fps_counter / elapsed_time
            fps_counter = 0
            start_time = time.time()

        if show_landmarks:
            draw_landmarks(image, results)

        # UI Info
        hand_status = "Hands: ✅" if hand_detected else "Hands: ❌"
        cv2.putText(image, hand_status, (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7,
                    (0, 255, 0) if hand_detected else (0, 0, 255), 2)

        if current_action:
            cv2.putText(image, f"Sign: {current_action}", (20, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
            cv2.rectangle(image, (20, 100), (320, 130), (50, 50, 50), -1)
            cv2.rectangle(image, (20, 100), (20 + int(avg_confidence * 300), 130),
                          (0, 255, 0), -1)
            cv2.putText(image, f"Confidence: {avg_confidence:.2f}", (20, 150),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        cv2.putText(image, f"Sequence: {len(sequence)}/{SEQUENCE_LENGTH}",
                    (image.shape[1] - 250, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)

        cv2.putText(image, f"FPS: {fps:.2f}", (20, image.shape[0] - 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

        progress_width = int(len(sequence) * (image.shape[1] / SEQUENCE_LENGTH))
        cv2.rectangle(image, (0, image.shape[0] - 10),
                      (progress_width, image.shape[0]), (0, 255, 0), -1)

        cv2.imshow("Sign Language Recognition", image)

        key = cv2.waitKey(10)
        if key & 0xFF == ord("q"):
            break
        elif key & 0xFF == ord("l"):
            show_landmarks = not show_landmarks
        elif key & 0xFF == ord("r"):
            sequence.clear()
            prediction_queue.clear()
            confidence_history.clear()
            current_action = ""
            cooldown_counter = 0

cap.release()
cv2.destroyAllWindows()
