import os
import cv2
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
import joblib

# Step 1: Load dataset
data_dir = "dataset"
X = []
y = []

for label in os.listdir(data_dir):
    label_dir = os.path.join(data_dir, label)
    for img_name in os.listdir(label_dir):
        img_path = os.path.join(label_dir, img_name)
        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        img = cv2.resize(img, (64, 64))  # resize all images to 64x64
        X.append(img.flatten())
        y.append(label)

X = np.array(X)
y = np.array(y)

# Step 2: Train model
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = KNeighborsClassifier(n_neighbors=3)
model.fit(X_train, y_train)

print("Accuracy:", model.score(X_test, y_test))

# Step 3: Save model
joblib.dump(model, "asl_model.pkl")
