import pandas as pd
from sklearn.model_selection import train_test_split

# Load the full dataset index
df = pd.read_csv("dataset_index.csv")

# Split into train and validation (80/20)
train_df, val_df = train_test_split(df, test_size=0.2, stratify=df['label'], random_state=42)

# Save to separate files
train_df.to_csv("train_index.csv", index=False)
val_df.to_csv("val_index.csv", index=False)

print(f"Train samples: {len(train_df)}, Validation samples: {len(val_df)}")
