import torch
import numpy as np
from models.cnn_rnn_model import CNNRNNModel
from utils.dataset import LandmarkDataset
from torch.nn.utils.rnn import pad_sequence

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load model and label map
checkpoint = torch.load("best_model.pth")
label2idx = checkpoint["label2idx"]
idx2label = {v: k for k, v in label2idx.items()}

model = CNNRNNModel(num_classes=len(label2idx))
model.load_state_dict(checkpoint["model_state_dict"])
model.to(device)
model.eval()

# Load a test file
path = "./utils/data/landmarks/book_07068.npy"  # Use any .npy file
sample = torch.tensor(np.load(path), dtype=torch.float32)
sample = (sample - 0.5) * 2
sample = pad_sequence([sample], batch_first=True)  # Shape [1, T, 1098]

with torch.no_grad():
    out = model(sample.to(device))
    pred = torch.argmax(out, dim=1).item()

print(f"Predicted class: {idx2label[pred]}")
