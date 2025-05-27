import os
import torch
import numpy as np
from torch.utils.data import Dataset

class LandmarkDataset(Dataset):
    def __init__(self, landmark_dir):
        self.landmark_dir = landmark_dir
        self.files = [f for f in os.listdir(landmark_dir) if f.endswith('.npy')]

        print(f"[DEBUG] landmark_dir: {landmark_dir}")
        print(f"[DEBUG] Files found: {self.files}")

        self.labels = sorted(set(f.split('_')[0] for f in self.files))
        self.label2idx = {label: idx for idx, label in enumerate(self.labels)}

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        file = self.files[idx]
        label_str = file.split('_')[0]
        label = self.label2idx[label_str]

        path = os.path.join(self.landmark_dir, file)
        landmarks = np.load(path)

        landmarks = (landmarks - 0.5) * 2
        landmarks = torch.tensor(landmarks, dtype=torch.float32)
        label = torch.tensor(label, dtype=torch.long)

        return landmarks, label
