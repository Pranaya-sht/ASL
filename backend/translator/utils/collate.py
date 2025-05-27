import torch
from torch.nn.utils.rnn import pad_sequence

def collate_fn(batch):
    sequences, labels = zip(*batch)

    # Pad sequences to the length of the longest in this batch
    padded_sequences = pad_sequence(sequences, batch_first=True)  # [B, T, 1098]
    labels = torch.tensor(labels)

    return padded_sequences, labels
