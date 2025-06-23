import os
import cv2
import json
import numpy as np
import mediapipe as mp
from tqdm import tqdm
from scipy import interpolate
from scipy.ndimage import gaussian_filter1d


# ===== Configuration =====
VIDEO_PATH = "raw_videos"
ANNOTATION_FILE = "WLASL_v0.3.json"
DATA_PATH = "MP_Data"
target_actions = [
    "book", "help", "hello", "thanks", "sorry",
    "yes", "no", "love", "want", "eat",
    "drink", "bathroom", "where", "who", "what",
    "when", "why", "how", "fine", "name"
]
 # Expanded vocabulary
no_sequences = 50  # Increased data volume
sequence_length = 30
FACE_SELECTION = [
    10,
    33,
    61,
    105,
    133,
    152,
    159,
    191,
    263,
    291,
    323,
    356,
    386,
]  # Key facial points

# Keypoint indices for different body parts
POSE_INDICES = list(range(0, 33 * 4))  # 33 pose landmarks * 4 (x,y,z,visibility)
FACE_INDICES = list(range(33 * 4, 33 * 4 + len(FACE_SELECTION) * 3))  # Face keypoints
LEFT_HAND_INDICES = list(
    range(33 * 4 + len(FACE_SELECTION) * 3, 33 * 4 + len(FACE_SELECTION) * 3 + 21 * 3)
)
RIGHT_HAND_INDICES = list(
    range(
        33 * 4 + len(FACE_SELECTION) * 3 + 21 * 3,
        33 * 4 + len(FACE_SELECTION) * 3 + 42 * 3,
    )
)

# ===== MediaPipe Setup =====
mp_holistic = mp.solutions.holistic
mp_face_mesh = mp.solutions.face_mesh


def mediapipe_detection(image, model):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image.flags.writeable = False
    results = model.process(image)
    image.flags.writeable = True
    return cv2.cvtColor(image, cv2.COLOR_RGB2BGR), results


def extract_keypoints(results):
    keypoint_list = []

    # Pose (33 landmarks)
    if results.pose_landmarks:
        for res in results.pose_landmarks.landmark:
            keypoint_list.extend([res.x, res.y, res.z, res.visibility])
    else:
        keypoint_list.extend([0] * 33 * 4)

    # Face (only key points)
    if results.face_landmarks:
        for i, res in enumerate(results.face_landmarks.landmark):
            if i in FACE_SELECTION:
                keypoint_list.extend([res.x, res.y, res.z])
    else:
        keypoint_list.extend([0] * len(FACE_SELECTION) * 3)

    # Left Hand
    if results.left_hand_landmarks:
        for res in results.left_hand_landmarks.landmark:
            keypoint_list.extend([res.x, res.y, res.z])
    else:
        keypoint_list.extend([0] * 21 * 3)

    # Right Hand
    if results.right_hand_landmarks:
        for res in results.right_hand_landmarks.landmark:
            keypoint_list.extend([res.x, res.y, res.z])
    else:
        keypoint_list.extend([0] * 21 * 3)

    return np.array(keypoint_list)


def validate_keypoints(keypoints):
    """Validate that keypoints are within reasonable ranges"""
    if np.any(np.isnan(keypoints)) or np.any(np.isinf(keypoints)):
        return False

    # Check if coordinates are within reasonable bounds (0-1 range + some margin)
    coord_indices = []
    for i in range(len(keypoints)):
        if i < 33 * 4:  # Pose coordinates (x,y,z,visibility)
            if i % 4 != 3:  # Skip visibility values
                coord_indices.append(i)
        else:  # Face and hand coordinates (x,y,z only)
            coord_indices.append(i)

    coords = keypoints[coord_indices]
    if np.any(coords < -0.5) or np.any(coords > 1.5):
        return False

    return True


def advanced_temporal_augmentation(sequence, aug_type="speed_variation"):
    """Advanced temporal augmentations for sign language"""
    if len(sequence) < 5:
        return sequence

    if aug_type == "speed_variation":
        # Non-linear speed variation (slow start, fast middle, slow end)
        t_original = np.linspace(0, 1, len(sequence))

        # Create speed profile (sigmoid-based)
        speed_factor = np.random.uniform(0.7, 1.4)
        sigmoid_factor = np.random.uniform(2, 6)

        # Generate non-uniform time sampling
        t_new = np.linspace(0, 1, sequence_length)
        speed_profile = 1 / (1 + np.exp(-sigmoid_factor * (t_new - 0.5)))
        speed_profile = (speed_profile - speed_profile.min()) / (
            speed_profile.max() - speed_profile.min()
        )
        speed_profile = speed_profile * speed_factor + (1 - speed_factor) / 2

        # Apply cumulative speed to get new time points
        cumulative_speed = np.cumsum(speed_profile)
        cumulative_speed = cumulative_speed / cumulative_speed[-1]

    elif aug_type == "pause_insertion":
        # Insert brief pauses at random points (common in sign language)
        pause_prob = 0.3
        pause_frames = int(sequence_length * 0.1)  # 10% of frames as pause

        t_original = np.linspace(0, 1, len(sequence))
        t_new = np.linspace(0, 1, sequence_length)

        # Randomly insert pause points
        if np.random.random() < pause_prob:
            pause_start = np.random.uniform(0.3, 0.7)
            pause_end = min(1.0, pause_start + 0.1)

            # Create time mapping with pause
            mask = (t_new >= pause_start) & (t_new <= pause_end)
            t_new[mask] = pause_start

        cumulative_speed = t_new

    elif aug_type == "motion_smoothing":
        # Apply Gaussian smoothing to create more fluid motion
        sigma = np.random.uniform(0.5, 2.0)
        smoothed_sequence = np.zeros_like(sequence)

        for dim in range(sequence.shape[1]):
            smoothed_sequence[:, dim] = gaussian_filter1d(sequence[:, dim], sigma=sigma)

        return (
            smoothed_sequence[:sequence_length]
            if len(smoothed_sequence) >= sequence_length
            else smoothed_sequence
        )

    else:  # Default linear interpolation
        t_original = np.linspace(0, 1, len(sequence))
        cumulative_speed = np.linspace(0, 1, sequence_length)

    # Interpolate using cubic spline for smoother motion
    augmented = np.zeros((sequence_length, sequence.shape[1]))

    for dim in range(sequence.shape[1]):
        try:
            # Use cubic spline interpolation for smoother results
            cs = interpolate.CubicSpline(
                t_original, sequence[:, dim], bc_type="natural"
            )
            augmented[:, dim] = cs(cumulative_speed)
        except:
            # Fallback to linear interpolation if cubic spline fails
            f = interpolate.interp1d(
                t_original,
                sequence[:, dim],
                kind="linear",
                bounds_error=False,
                fill_value="extrapolate",
            )
            augmented[:, dim] = f(cumulative_speed)

    return augmented


def pose_aware_spatial_augmentation(keypoints, body_part="all"):
    """Apply pose-aware spatial augmentations"""
    augmented = keypoints.copy()

    if body_part == "hands" or body_part == "all":
        # Emphasize hand movements (important for sign language)
        hand_emphasis = np.random.uniform(0.95, 1.15)

        # Left hand
        if np.any(keypoints[LEFT_HAND_INDICES] != 0):
            hand_center = np.mean(keypoints[LEFT_HAND_INDICES].reshape(-1, 3), axis=0)
            for i in range(0, len(LEFT_HAND_INDICES), 3):
                if keypoints[LEFT_HAND_INDICES[i]] != 0:  # Non-zero keypoint
                    # Scale relative to hand center
                    relative_pos = keypoints[LEFT_HAND_INDICES[i : i + 3]] - hand_center
                    augmented[LEFT_HAND_INDICES[i : i + 3]] = (
                        hand_center + relative_pos * hand_emphasis
                    )

        # Right hand
        if np.any(keypoints[RIGHT_HAND_INDICES] != 0):
            hand_center = np.mean(keypoints[RIGHT_HAND_INDICES].reshape(-1, 3), axis=0)
            for i in range(0, len(RIGHT_HAND_INDICES), 3):
                if keypoints[RIGHT_HAND_INDICES[i]] != 0:  # Non-zero keypoint
                    relative_pos = (
                        keypoints[RIGHT_HAND_INDICES[i : i + 3]] - hand_center
                    )
                    augmented[RIGHT_HAND_INDICES[i : i + 3]] = (
                        hand_center + relative_pos * hand_emphasis
                    )

    if body_part == "face" or body_part == "all":
        # Facial expression variations (important for sign language grammar)
        if np.any(keypoints[FACE_INDICES] != 0):
            face_intensity = np.random.uniform(0.98, 1.05)
            face_center = np.mean(keypoints[FACE_INDICES].reshape(-1, 3), axis=0)

            for i in range(0, len(FACE_INDICES), 3):
                if keypoints[FACE_INDICES[i]] != 0:
                    relative_pos = keypoints[FACE_INDICES[i : i + 3]] - face_center
                    augmented[FACE_INDICES[i : i + 3]] = (
                        face_center + relative_pos * face_intensity
                    )

    if body_part == "pose" or body_part == "all":
        # Body pose variations (perspective changes)
        rotation_angle = np.random.uniform(-5, 5) * np.pi / 180  # Small rotation

        # Apply rotation to pose keypoints (only x,y coordinates)
        cos_angle, sin_angle = np.cos(rotation_angle), np.sin(rotation_angle)

        for i in range(0, len(POSE_INDICES), 4):  # Every 4th element (x,y,z,visibility)
            if keypoints[POSE_INDICES[i]] != 0:  # Non-zero keypoint
                x, y = keypoints[POSE_INDICES[i]], keypoints[POSE_INDICES[i + 1]]
                # Rotate around center point (0.5, 0.5)
                x_centered, y_centered = x - 0.5, y - 0.5
                x_rot = x_centered * cos_angle - y_centered * sin_angle
                y_rot = x_centered * sin_angle + y_centered * cos_angle
                augmented[POSE_INDICES[i]] = x_rot + 0.5
                augmented[POSE_INDICES[i + 1]] = y_rot + 0.5

    return augmented


def advanced_noise_augmentation(keypoints):
    """Apply realistic noise patterns"""
    augmented = keypoints.copy()

    # Different noise levels for different body parts
    pose_noise = np.random.normal(
        0, 0.008, size=len(POSE_INDICES)
    )  # Lower noise for pose
    face_noise = np.random.normal(
        0, 0.005, size=len(FACE_INDICES)
    )  # Minimal face noise
    hand_noise = np.random.normal(
        0, 0.015, size=len(LEFT_HAND_INDICES + RIGHT_HAND_INDICES)
    )  # Higher hand noise

    # Apply noise only to non-zero keypoints
    for i, idx in enumerate(POSE_INDICES):
        if keypoints[idx] != 0:
            augmented[idx] += pose_noise[i]

    for i, idx in enumerate(FACE_INDICES):
        if keypoints[idx] != 0:
            augmented[idx] += face_noise[i]

    hand_indices = LEFT_HAND_INDICES + RIGHT_HAND_INDICES
    for i, idx in enumerate(hand_indices):
        if keypoints[idx] != 0:
            augmented[idx] += hand_noise[i]

    return augmented


def augment_sequence(original_path, target_dir, augmentation_strength="medium"):
    """Enhanced sequence augmentation with multiple techniques"""
    try:
        original_seq = [
            np.load(os.path.join(original_path, f"{i}.npy"))
            for i in range(sequence_length)
        ]
        original_seq = np.array(original_seq)

        # Validate original sequence
        if not all(validate_keypoints(frame) for frame in original_seq):
            print(f"⚠️ Invalid keypoints in original sequence: {original_path}")
            return False

        # Choose augmentation strategy based on strength
        if augmentation_strength == "light":
            techniques = ["speed_variation"]
            spatial_prob = 0.3
        elif augmentation_strength == "medium":
            techniques = ["speed_variation", "pause_insertion", "motion_smoothing"]
            spatial_prob = 0.6
        else:  # heavy
            techniques = ["speed_variation", "pause_insertion", "motion_smoothing"]
            spatial_prob = 0.8

        # Apply temporal augmentation
        temporal_technique = np.random.choice(techniques)
        augmented_seq = advanced_temporal_augmentation(original_seq, temporal_technique)

        # Ensure correct sequence length
        if len(augmented_seq) > sequence_length:
            augmented_seq = augmented_seq[:sequence_length]
        elif len(augmented_seq) < sequence_length:
            pad_length = sequence_length - len(augmented_seq)
            if len(augmented_seq) > 0:
                padding = np.tile(augmented_seq[-1], (pad_length, 1))
            else:
                padding = np.zeros((pad_length, original_seq.shape[1]))
            augmented_seq = np.vstack((augmented_seq, padding))

        # Apply spatial augmentations with probability
        for i in range(len(augmented_seq)):
            if np.random.random() < spatial_prob:
                # Choose body part to augment
                body_parts = ["hands", "face", "pose", "all"]
                weights = [0.4, 0.2, 0.2, 0.2]  # Emphasize hands for sign language
                chosen_part = np.random.choice(body_parts, p=weights)

                augmented_seq[i] = pose_aware_spatial_augmentation(
                    augmented_seq[i], chosen_part
                )

            # Apply realistic noise
            if np.random.random() < 0.7:  # 70% chance of noise
                augmented_seq[i] = advanced_noise_augmentation(augmented_seq[i])

            # Ensure keypoints remain valid
            augmented_seq[i] = np.clip(augmented_seq[i], -0.5, 1.5)

        # Final validation
        if not all(validate_keypoints(frame) for frame in augmented_seq):
            print(f"⚠️ Generated invalid augmented sequence for: {original_path}")
            return False

        # Save augmented sequence
        os.makedirs(target_dir, exist_ok=True)
        for i, frame in enumerate(augmented_seq):
            np.save(os.path.join(target_dir, f"{i}.npy"), frame)

        return True

    except Exception as e:
        print(f"⚠️ Error augmenting sequence {original_path}: {str(e)}")
        return False


# ===== Load Annotations =====
with open(ANNOTATION_FILE, "r") as f:
    annotations = json.load(f)

action_video_map = {action: [] for action in target_actions}
for entry in annotations:
    gloss = entry["gloss"].lower()
    if gloss in target_actions:
        for inst in entry["instances"]:
            action_video_map[gloss].append(
                {
                    "video_id": inst["video_id"] + ".mp4",
                    "start": inst.get("frame_start", 0),
                    "end": inst.get("frame_end", None),
                    "signer_id": inst.get("signer_id", 0),
                }
            )

# ===== Create Dataset Directories =====
print("🔧 Creating dataset folders...")
for action in tqdm(target_actions):
    os.makedirs(os.path.join(DATA_PATH, action), exist_ok=True)

# ===== Start Processing =====
with mp_holistic.Holistic(
    min_detection_confidence=0.5, min_tracking_confidence=0.5, model_complexity=1
) as holistic:
    for action in target_actions:
        print(f"\n🚀 Processing action: {action}")
        sequence_count = 0
        video_entries = action_video_map[action]

        if not video_entries:
            print(f"⚠️ No videos found for action: {action}")
            continue

        # Process real videos first
        for video_info in tqdm(video_entries, desc=f"{action} videos"):
            if sequence_count >= no_sequences:
                break

            file_path = os.path.join(VIDEO_PATH, video_info["video_id"])
            if not os.path.isfile(file_path):
                tqdm.write(f"⚠️ File not found: {file_path}")
                continue

            cap = cv2.VideoCapture(file_path)
            if not cap.isOpened():
                tqdm.write(f"⚠️ Could not open {file_path}")
                continue

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            start = video_info["start"] or 0
            end = video_info["end"]
            if end is None or end <= 0 or end > total_frames:
                end = total_frames

            if start >= end:
                tqdm.write(
                    f"⚠️ Invalid frame range ({start}-{end}) in {video_info['video_id']}"
                )
                cap.release()
                continue

            cap.set(cv2.CAP_PROP_POS_FRAMES, start)
            actual_start = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
            if actual_start != start:
                tqdm.write(
                    f"⚠️ Seek failed ({actual_start} vs {start}) in {video_info['video_id']}"
                )
                cap.release()
                continue

            seq_dir = os.path.join(DATA_PATH, action, str(sequence_count))
            keypoints_list = []
            valid = True

            for _ in range(min(sequence_length, end - start)):
                ret, frame = cap.read()
                if not ret:
                    valid = False
                    break
                image, results = mediapipe_detection(frame, holistic)
                keypoints = extract_keypoints(results)
                keypoints_list.append(keypoints)

            cap.release()

            if not valid or not keypoints_list:
                tqdm.write(
                    f"⚠️ Skipping {video_info['video_id']} due to frame read error."
                )
                continue

            # Pad sequence if needed
            if len(keypoints_list) < sequence_length:
                pad_length = sequence_length - len(keypoints_list)
                if keypoints_list:
                    padding = [keypoints_list[-1]] * pad_length  # Repeat last frame
                else:
                    continue  # Skip if no valid frames
                keypoints_list.extend(padding)
            else:
                keypoints_list = keypoints_list[:sequence_length]

            os.makedirs(seq_dir, exist_ok=True)
            for frame_num, keypoints in enumerate(keypoints_list):
                np.save(os.path.join(seq_dir, f"{frame_num}.npy"), keypoints)

            sequence_count += 1
            tqdm.write(
                f"✅ Sequence {sequence_count}/{no_sequences} collected from {video_info['video_id']}"
            )

      # Generate augmentations if needed
    if sequence_count < no_sequences:
        if sequence_count == 0:
            print(f"❌ No valid sequences to augment for '{action}', skipping augmentation.")
             

    num_augmentations = no_sequences - sequence_count
    print(
        f"⚠️ Not enough real sequences for '{action}' ({sequence_count}), generating {num_augmentations} augmentations..."
    )
    existing_dirs = [
        os.path.join(DATA_PATH, action, str(i)) for i in range(sequence_count)
    ]

    successful_augmentations = 0
    attempt_count = 0
    max_attempts = num_augmentations * 3  # Allow multiple attempts

    while (
        successful_augmentations < num_augmentations
        and attempt_count < max_attempts
    ):
        base_dir = existing_dirs[attempt_count % len(existing_dirs)]
        target_dir = os.path.join(
            DATA_PATH, action, str(sequence_count + successful_augmentations)
        )

        # Vary augmentation strength
        if successful_augmentations < num_augmentations * 0.4:
            strength = "light"
        elif successful_augmentations < num_augmentations * 0.8:
            strength = "medium"
        else:
            strength = "heavy"

        if augment_sequence(base_dir, target_dir, strength):
            successful_augmentations += 1
            tqdm.write(
                f"✅ Augmented sequence {sequence_count + successful_augmentations}/{no_sequences} created (strength: {strength})"
            )
        else:
            tqdm.write(f"⚠️ Failed to create augmentation, retrying...")

        attempt_count += 1

    sequence_count += successful_augmentations

    if successful_augmentations < num_augmentations:
        print(
            f"⚠️ Could only generate {successful_augmentations}/{num_augmentations} augmentations for '{action}'"
        )


print("\n✅ All done! Dataset created under `MP_Data/`")
total_sequences = sum(
    len(os.listdir(os.path.join(DATA_PATH, act))) for act in target_actions
)
print(f"Total sequences collected: {total_sequences}")

# Print augmentation statistics
for action in target_actions:
    action_dir = os.path.join(DATA_PATH, action)
    if os.path.exists(action_dir):
        count = len(os.listdir(action_dir))
        print(f"  - {action}: {count} sequences")
