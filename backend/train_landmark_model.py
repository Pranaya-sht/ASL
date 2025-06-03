import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Load the dataset
df = pd.read_csv("landmarks.csv")

# Separate features and label
X = df.drop("label", axis=1)
y = df["label"]

# Encode labels to numeric
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Save the label encoder for decoding predictions later
joblib.dump(le, "label_encoder.pkl")

# Split the dataset
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42
)

# Train the KNN classifier
model = KNeighborsClassifier(n_neighbors=3)
model.fit(X_train, y_train)

# Evaluate and print accuracy
accuracy = model.score(X_test, y_test)
print("Accuracy:", accuracy)

joblib.dump(model, "landmark_model.pkl")
