import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.dataset import LandmarkDataset
from utils.collate import collate_fn
from torch.utils.data import DataLoader

dataset = LandmarkDataset("data/landmarks")
loader = DataLoader(dataset, batch_size=4, shuffle=True, collate_fn=collate_fn)

print(f"Loaded {len(dataset)} samples.")

for batch in loader:
    x, y = batch
    print("Input shape:", x.shape)  # e.g., [4, 86, 1098]
    print("Label indices:", y)      # e.g., tensor([0, 1, 0, 2])
    break
