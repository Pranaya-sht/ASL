# train.py
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
import cv2
import pandas as pd
from tqdm import tqdm
from model import CNNLSTM  # Import the improved model

# Parameters
NUM_FRAMES = 16
IMAGE_SIZE = 224
BATCH_SIZE = 8
EPOCHS = 10
LEARNING_RATE = 1e-4

# Dataset class
class SignLanguageDataset(Dataset):
    def __init__(self, csv_file, root_dir, transform=None):
        self.annotations = pd.read_csv(csv_file)
        self.root_dir = root_dir
        self.transform = transform
        self.label2idx = {label: idx for idx, label in enumerate(self.annotations['label'].unique())}
        self.idx2label = {idx: label for label, idx in self.label2idx.items()}

    def __len__(self):
        return len(self.annotations)

    def read_video(self, filepath):
        cap = cv2.VideoCapture(filepath)
        frames = []
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        step = max(1, total // NUM_FRAMES)

        for i in range(0, total, step):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if not ret:
                continue
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame = cv2.resize(frame, (IMAGE_SIZE, IMAGE_SIZE))
            if self.transform:
                frame = self.transform(frame)
            frames.append(frame)
            if len(frames) >= NUM_FRAMES:
                break
        cap.release()
        while len(frames) < NUM_FRAMES:
            frames.append(frames[-1])  # pad with last frame
        return torch.stack(frames)

    def __getitem__(self, idx):
        video_path = os.path.join(self.root_dir, self.annotations.iloc[idx, 0])
        label = self.annotations.iloc[idx, 1]
        frames = self.read_video(video_path)
        return frames, self.label2idx[label]

# Training function
def train():
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize([0.5]*3, [0.5]*3)
    ])

    # Dataset
    train_dataset = SignLanguageDataset("train_index.csv", root_dir='.', transform=transform)
    val_dataset = SignLanguageDataset("val_index.csv", root_dir='.', transform=transform)

    # DataLoaders
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    # Model, criterion, optimizer
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model = CNNLSTM(num_classes=len(train_dataset.label2idx)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    # Training loop
    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0
        for frames, labels in tqdm(train_loader):
            frames, labels = frames.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(frames)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        print(f"Epoch {epoch+1}/{EPOCHS}, Training Loss: {total_loss/len(train_loader):.4f}")

        # Validation
        model.eval()
        val_loss = 0
        correct = 0
        total = 0

        with torch.no_grad():
            for frames, labels in val_loader:
                frames, labels = frames.to(device), labels.to(device)
                outputs = model(frames)
                val_loss += criterion(outputs, labels).item()
                _, predicted = torch.max(outputs, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()

        accuracy = 100 * correct / total
        print(f"Epoch {epoch+1}/{EPOCHS}, Val Loss: {val_loss/len(val_loader):.4f}, Accuracy: {accuracy:.2f}%")

    # Save model and label dictionary
    torch.save(model.state_dict(), 'asl_model.pth')
    torch.save(train_dataset.idx2label, 'label_map.pth')

if __name__ == '__main__':
    train()
