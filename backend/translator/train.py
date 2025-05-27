import os
import torch
from torch.utils.data import DataLoader
from torch import nn, optim
from utils.dataset import LandmarkDataset
from utils.collate import collate_fn
from models.cnn_rnn_model import CNNRNNModel

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load dataset
dataset = LandmarkDataset(os.path.abspath("./utils/data/landmarks"))
num_classes = len(dataset.labels)
label2idx = dataset.label2idx
idx2label = {v: k for k, v in label2idx.items()}

loader = DataLoader(dataset, batch_size=4, shuffle=True, collate_fn=collate_fn)

# Initialize model
model = CNNRNNModel(num_classes=num_classes).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)

# Training loop
epochs = 10
best_acc = 0.0

for epoch in range(epochs):
    model.train()
    total_loss = 0
    correct = 0
    total = 0

    for x, y in loader:
        x, y = x.to(device), y.to(device)

        optimizer.zero_grad()
        out = model(x)
        loss = criterion(out, y)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        preds = out.argmax(dim=1)
        correct += (preds == y).sum().item()
        total += y.size(0)

    acc = correct / total
    print(f"[Epoch {epoch+1}] Loss: {total_loss / len(loader):.4f} | Accuracy: {acc:.4f}")

    # Save the best model
    if acc > best_acc:
        best_acc = acc
        torch.save({
            'model_state_dict': model.state_dict(),
            'label2idx': label2idx
        }, "best_model.pth")
        print("✅ Model saved!")

