import torch
import cv2
import torchvision.transforms as transforms
from model import CNNLSTM
import requests
import jwt

# 🔐 Your JWT secret (should match FastAPI settings)
JWT_SECRET = "your_jwt_secret"
JWT_ALGORITHM = "HS256"
TOKEN_PATH = "token.txt"  # Save the token in this file after login

API_ENDPOINT = "http://localhost:8000/users/api/flashcards/predict"

# Load model
model = CNNLSTM(num_classes=100)
model.load_state_dict(torch.load("asl_model.pth", map_location='cpu'))
model.eval()

# Load label mapping
label_map = torch.load("label_map.pth")

# Transforms
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Resize((224, 224)),
    transforms.Normalize([0.5] * 3, [0.5] * 3)
])

# Load token and extract user_id
def get_user_id_from_token():
    try:
        with open(TOKEN_PATH, "r") as f:
            token = f.read().strip()
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded.get("user_id"), token
    except Exception as e:
        print("❌ Failed to load or decode token:", e)
        return None, None

# Send prediction to backend
def send_prediction_to_api(user_id, token, label):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "user_id": user_id,
        "prediction": label
    }
    try:
        response = requests.post(API_ENDPOINT, json=data, headers=headers)
        print(f"✅ Sent prediction '{label}' | Response:", response.status_code)
    except Exception as e:
        print("❌ Failed to send prediction:", e)

# Get user ID
user_id, token = get_user_id_from_token()
if not user_id:
    print("User ID not found. Make sure you are logged in and token.txt contains a valid JWT.")
    exit()

# Start webcam
frames_buffer = []
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_tensor = transform(frame_rgb)
    frames_buffer.append(frame_tensor)

    if len(frames_buffer) == 16:
        input_tensor = torch.stack(frames_buffer).unsqueeze(0)
        with torch.no_grad():
            outputs = model(input_tensor)
            _, pred = torch.max(outputs, 1)
            label = label_map[pred.item()]
            print("🧠 Prediction:", label)

            send_prediction_to_api(user_id, token, label)

        frames_buffer = []

    cv2.imshow("ASL Real-Time Recognition", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
