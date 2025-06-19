import cv2
import numpy as np
from keras.models import load_model
import json

# Load model and class map
model = load_model("asl_model.h5")
with open("class_map.json", "r") as f:
    class_map = json.load(f)

# Reverse class map
inv_class_map = {v: k for k, v in class_map.items()}

image_size = 64
confidence_threshold = 0.8  # 80% confidence threshold

# Start webcam
cap = cv2.VideoCapture(0)
print("Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Define ROI box
    x, y, w, h = 50, 50, 300, 300
    roi = frame[y:y+h, x:x+w]
    roi_resized = cv2.resize(roi, (image_size, image_size))
    roi_normalized = roi_resized.astype("float") / 255.0
    roi_reshaped = np.expand_dims(roi_normalized, axis=0)

    # Predict
    prediction = model.predict(roi_reshaped)[0]
    class_idx = np.argmax(prediction)
    confidence = prediction[class_idx]

    # Display only if confident enough
    if confidence >= confidence_threshold:
        class_label = inv_class_map[class_idx]
        label_display = f"{class_label} ({confidence*100:.1f}%)"
    else:
        label_display = "..."

    # Display
    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
    cv2.putText(frame, label_display, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
    cv2.imshow("ASL Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()