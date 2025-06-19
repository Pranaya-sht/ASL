import os
import numpy as np
import cv2
from sklearn.model_selection import train_test_split
from keras.utils import to_categorical
from keras.models import Sequential
from keras.layers import Dense, Conv2D, Dropout, Flatten, MaxPooling2D
from keras.preprocessing.image import img_to_array, load_img
from keras.models import load_model

# Path to your dataset (update this if needed)
dataset_path = "./dataset"
image_size = 64

# Load dataset
def load_data(dataset_path):
    images = []
    labels = []
    classes = sorted(os.listdir(dataset_path))
    class_map = {cls: idx for idx, cls in enumerate(classes)}

    for cls in classes:
        cls_path = os.path.join(dataset_path, cls)
        if not os.path.isdir(cls_path):
            continue
        for img_name in os.listdir(cls_path)[:300]:  # Limit for faster training
            img_path = os.path.join(cls_path, img_name)
            img = load_img(img_path, target_size=(image_size, image_size))
            img_array = img_to_array(img)
            images.append(img_array)
            labels.append(class_map[cls])

    X = np.array(images, dtype="float") / 255.0
    y = to_categorical(labels, num_classes=len(classes))
    return X, y, class_map

print("Loading data...")
X, y, class_map = load_data(dataset_path)
print("Data loaded.")

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Build CNN model
model = Sequential([
    Conv2D(32, kernel_size=(3, 3), activation='relu', input_shape=(image_size, image_size, 3)),
    MaxPooling2D(pool_size=(2, 2)),
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D(pool_size=(2, 2)),
    Dropout(0.25),
    Flatten(),
    Dense(128, activation='relu'),
    Dropout(0.5),
    Dense(len(class_map), activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.summary()

# Train model
model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=10, batch_size=64)

# Save model and class map
model.save("asl_model.h5")
import json
with open("class_map.json", "w") as f:
    json.dump(class_map, f)

print("Model training complete and saved.")
