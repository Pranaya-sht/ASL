import os
import torch
from torch.utils.data import Dataset
from torchvision import transforms
from PIL import Image

class WLASLDataset(Dataset):
    def __init__(self, index_csv, frames_dir, transform=None, max_frames=30):
        import pandas as pd
        self.df = pd.read_csv(index_csv)
        self.frames_dir = frames_dir
        self.transform = transform
        self.max_frames = max_frames
        self.label2idx = {label: idx for idx, label in enumerate(sorted(self.df['label'].unique()))}

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        video_path = row['video_path']
        video_id = os.path.splitext(os.path.basename(video_path))[0]
        label = self.label2idx[row['label']]

        # Load frames from the directory
        frame_folder = os.path.join(self.frames_dir, video_id)
        frame_files = sorted([f for f in os.listdir(frame_folder) if f.endswith('.jpg')])

        # Limit to max_frames
        frame_files = frame_files[:self.max_frames]

        frames = []
        for f in frame_files:
            img_path = os.path.join(frame_folder, f)
            image = Image.open(img_path).convert('RGB')
            if self.transform:
                image = self.transform(image)
            frames.append(image)

        # Pad if fewer frames
        while len(frames) < self.max_frames:
            frames.append(torch.zeros_like(frames[0]))

        video_tensor = torch.stack(frames)  # Shape: (T, C, H, W)
        return video_tensor, label
