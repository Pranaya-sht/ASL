import os
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import (
    Bidirectional,
    LSTM,
    Dense,
    Dropout,
    BatchNormalization,
    LayerNormalization,
    Conv1D,
    MaxPooling1D,
    Input,
    Multiply,
    Activation,
    GlobalAveragePooling1D,
    Reshape,
    Permute,
)
from tensorflow.keras.optimizers import Adam, Nadam
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint,
    TensorBoard,
)
from tensorflow.keras.regularizers import l2
import tensorflow as tf

# Configuration
DATA_PATH = "MP_Data"
actions = np.array( [
    "book", "help", "hello", "thanks", "sorry",
    "yes", "no", "love", "want", "eat",
    "drink", "bathroom", "where", "who", "what",
    "when", "why", "how", "fine", "name"
])  # Expanded vocabulary
no_sequences = 50  # Matches dataset
sequence_length = 30

# Load and preprocess data
label_map = {label: num for num, label in enumerate(actions)}
sequences, labels = [], []

for action in actions:
    action_dir = os.path.join(DATA_PATH, action)
    if not os.path.exists(action_dir):
        print(f"⚠️ Directory not found: {action_dir}")
        continue

    for sequence in os.listdir(action_dir):
        sequence_path = os.path.join(action_dir, sequence)
        if not os.path.isdir(sequence_path):
            continue

        window = []
        valid_sequence = True

        for frame_num in range(sequence_length):
            frame_path = os.path.join(sequence_path, f"{frame_num}.npy")
            if not os.path.exists(frame_path):
                valid_sequence = False
                break

            res = np.load(frame_path)
            window.append(res)

        if valid_sequence:
            sequences.append(window)
            labels.append(label_map[action])

X = np.array(sequences)
y = to_categorical(LabelEncoder().fit_transform(labels))

# Train-test split with stratification
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.15,
    stratify=y,
    random_state=42,
)

# Validation split
X_train, X_val, y_train, y_val = train_test_split(
    X_train,
    y_train,
    test_size=0.15,
    stratify=y_train,
    random_state=42,
)

# Normalize data
training_mean = np.mean(X_train, axis=(0, 1))
training_std = np.std(X_train, axis=(0, 1))

X_train = (X_train - training_mean) / (training_std + 1e-8)
X_val = (X_val - training_mean) / (training_std + 1e-8)
X_test = (X_test - training_mean) / (training_std + 1e-8)

# Save normalization parameters
np.save("training_mean.npy", training_mean)
np.save("training_std.npy", training_std)


# Attention Mechanism
def attention_block(inputs):
    # Channel attention
    channel = GlobalAveragePooling1D()(inputs)
    channel = Dense(inputs.shape[-1] // 8, activation="relu")(channel)
    channel = Dense(inputs.shape[-1], activation="sigmoid")(channel)
    channel = Reshape((1, inputs.shape[-1]))(channel)

    # Temporal attention
    temporal = Conv1D(64, kernel_size=3, padding="same", activation="relu")(inputs)
    temporal = Conv1D(1, kernel_size=3, padding="same", activation="sigmoid")(temporal)

    # Combine attentions
    attention = Multiply()([channel, temporal])
    return Multiply()([inputs, attention])


# Enhanced Hybrid Model
def create_model():
    inputs = Input(shape=(sequence_length, X_train.shape[-1]))

    # Input normalization
    x = LayerNormalization(axis=-1)(inputs)

    # Temporal convolution blocks
    x = Conv1D(128, kernel_size=5, activation="relu", padding="same")(x)
    x = BatchNormalization()(x)
    x = MaxPooling1D(2)(x)
    x = Dropout(0.3)(x)

    x = Conv1D(256, kernel_size=5, activation="relu", padding="same")(x)
    x = BatchNormalization()(x)
    x = MaxPooling1D(2)(x)
    x = Dropout(0.3)(x)

    # Attention mechanism
    x = attention_block(x)

    # Bidirectional LSTMs
    x = Bidirectional(LSTM(256, return_sequences=True))(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)

    x = Bidirectional(LSTM(128, return_sequences=True))(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)

    x = Bidirectional(LSTM(64, return_sequences=False))(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)

    # Classifier
    x = Dense(256, activation="relu", kernel_regularizer=l2(0.001))(x)
    x = BatchNormalization()(x)
    x = Dropout(0.5)(x)

    x = Dense(128, activation="relu", kernel_regularizer=l2(0.001))(x)
    x = Dropout(0.4)(x)

    outputs = Dense(actions.shape[0], activation="softmax")(x)

    model = Model(inputs=inputs, outputs=outputs)
    return model


model = create_model()
model.summary()

# Configure callbacks
early_stopping = EarlyStopping(
    monitor="val_loss", patience=30, restore_best_weights=True, verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss", factor=0.2, patience=10, min_lr=1e-6, verbose=1
)

model_checkpoint = ModelCheckpoint(
    "best_asl_model.h5",
    monitor="val_categorical_accuracy",
    save_best_only=True,
    mode="max",
    verbose=1,
)

tensorboard = TensorBoard(
    log_dir="logs", histogram_freq=1, write_graph=True, update_freq="epoch"
)

# Compile model
optimizer = Nadam(learning_rate=0.0005, clipnorm=1.0)
model.compile(
    optimizer=optimizer,
    loss="categorical_crossentropy",
    metrics=["categorical_accuracy"],
)

# Train model
history = model.fit(
    X_train,
    y_train,
    epochs=200,
    batch_size=32,
    validation_data=(X_val, y_val),
    callbacks=[early_stopping, reduce_lr, model_checkpoint, tensorboard],
    verbose=1,
)

# Load best model
model.load_weights("best_asl_model.h5")

# Evaluate on test set
test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
print(f"\nTest Accuracy: {test_acc:.4f}")
print(f"Test Loss: {test_loss:.4f}")

# Save final model
model.save("asl_model.h5")
np.save("classes.npy", actions)
print("Model saved successfully")
