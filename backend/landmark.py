import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
import joblib

# Load model and label encoder
model = tf.keras.models.load_model("cnn_lstm_landmark_model.h5")
le = joblib.load("label_encoder.pkl")

# Mediapipe setup
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.7)
mp_drawing = mp.solutions.drawing_utils

def preprocess_landmarks(landmarks):
    x = [lm.x for lm in landmarks]
    y = [lm.y for lm in landmarks]
    z = [lm.z for lm in landmarks]

    # Normalize using wrist as origin
    x0, y0 = x[0], y[0]
    x = [i - x0 for i in x]
    y = [i - y0 for i in y]

    return np.array(list(zip(x, y, z)), dtype=np.float32).reshape(1, 21, 3)

# Webcam loop
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(img_rgb)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            # Preprocess and predict
            input_data = preprocess_landmarks(hand_landmarks.landmark)
            prediction = model.predict(input_data)
            class_id = np.argmax(prediction)
            class_label = le.inverse_transform([class_id])[0]

            # Display
            cv2.putText(frame, f'{class_label} ({prediction[0][class_id]:.2f})', (10, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("Hand Gesture Recognition", frame)
    if cv2.waitKey(1) & 0xFF == 27:  # ESC to exit
        break

cap.release()
cv2.destroyAllWindows()
