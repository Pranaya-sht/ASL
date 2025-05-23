import torch
import torch.nn as nn
import torchvision.models as models

class CNNLSTM(nn.Module):
    def __init__(self, hidden_dim=256, num_classes=100, cnn_out_dim=512):
        super(CNNLSTM, self).__init__()
        # CNN: Use pretrained ResNet18 as feature extractor
        resnet = models.resnet18(pretrained=True)
        self.cnn = nn.Sequential(*list(resnet.children())[:-1])  # Remove final FC
        self.cnn_out_dim = cnn_out_dim

        # LSTM
        self.lstm = nn.LSTM(input_size=cnn_out_dim, hidden_size=hidden_dim, num_layers=1, batch_first=True)

        # Classifier
        self.fc = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):  # x shape: (B, T, C, H, W)
        B, T, C, H, W = x.shape
        x = x.view(B * T, C, H, W)
        cnn_features = self.cnn(x).view(B, T, -1)  # (B, T, cnn_out_dim)
        lstm_out, _ = self.lstm(cnn_features)  # (B, T, hidden_dim)
        last_output = lstm_out[:, -1, :]  # Take last time step
        out = self.fc(last_output)
        return out
