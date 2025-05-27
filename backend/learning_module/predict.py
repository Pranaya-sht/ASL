import torch
import cv2
import torchvision.transforms as transforms
from model import CNNLSTM
import requests
import threading
import queue
import time

API_ENDPOINT = "http://localhost:8000/users/api/flashcards/predict"

model = CNNLSTM(num_classes=247)
model.load_state_dict(torch.load("asl_model.pth", map_location='cpu'))
model.eval()

label_map = torch.load("label_map.pth")

transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Resize((224, 224)),
    transforms.Normalize([0.5] * 3, [0.5] * 3)
])

def send_prediction_to_api(label):
    data = {"prediction": label}
    try:
        response = requests.post(API_ENDPOINT, json=data)
        print(f"✅ Sent prediction '{label}' | Response:", response.status_code)
    except Exception as e:
        print("❌ Failed to send prediction:", e)

# Thread-safe queue to send frames from main thread to worker
frame_queue = queue.Queue(maxsize=32)

# Worker thread function for inference
def inference_worker():
    frames_buffer = []
    while True:
        try:
            # Get frame tensor from queue, blocking with timeout
            frame_tensor = frame_queue.get(timeout=1)
            frames_buffer.append(frame_tensor)

            if len(frames_buffer) == 16:
                input_tensor = torch.stack(frames_buffer).unsqueeze(0)
                with torch.no_grad():
                    outputs = model(input_tensor)
                    _, pred = torch.max(outputs, 1)
                    label = label_map[pred.item()]
                    print("🧠 Prediction:", label)
                    send_prediction_to_api(label)
                frames_buffer = []

            frame_queue.task_done()
        except queue.Empty:
            # No new frames for a while, continue loop
            continue

# Start worker thread
thread = threading.Thread(target=inference_worker, daemon=True)
thread.start()

# Capture from webcam using DirectShow backend (fix MSMF warnings)
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_tensor = transform(frame_rgb)

    # Try to put frame tensor into queue without blocking (drop if full)
    try:
        frame_queue.put_nowait(frame_tensor)
    except queue.Full:
        pass  # skip frame if queue is full to avoid blocking

    # Show frame immediately
    cv2.imshow("ASL Real-Time Recognition", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
