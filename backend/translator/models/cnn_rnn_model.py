import torch
import torch.nn as nn

class CNNRNNModel(nn.Module):
    def __init__(self, input_size=1098, cnn_out=256, hidden_size=128, num_classes=10):
        super(CNNRNNModel, self).__init__()

        self.cnn = nn.Sequential(
            nn.Linear(input_size, 512),
            nn.ReLU(),
            nn.Linear(512, cnn_out),
            nn.ReLU()
        )

        self.rnn = nn.LSTM(input_size=cnn_out,
                           hidden_size=hidden_size,
                           batch_first=True)

        self.classifier = nn.Sequential(
            nn.Linear(hidden_size, 128),
            nn.ReLU(),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        # x: [B, T, 1098]
        B, T, F = x.shape
        x = x.view(-1, F)         # [B*T, 1098]
        x = self.cnn(x)           # [B*T, cnn_out]
        x = x.view(B, T, -1)      # [B, T, cnn_out]
        _, (hn, _) = self.rnn(x)  # hn: [1, B, hidden]
        hn = hn.squeeze(0)        # [B, hidden]
        out = self.classifier(hn) # [B, num_classes]
        return out
