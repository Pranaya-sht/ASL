import os
import json

# 🔁 Your source and destination folders
INPUT_FOLDER = "./keypoints"         # where your original 2000 JSONs are
OUTPUT_FOLDER = "./simplified"       # where to save new simplified ones
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Pose joints to keep (MediaPipe indices)
POSE_MAP = {
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16
}

def simplify_frame(frame):
    simplified = {
        "pose": {},
        "left_hand": frame.get("left_hand", []),
        "right_hand": frame.get("right_hand", [])
    }

    pose = frame.get("pose", [])
    for name, idx in POSE_MAP.items():
        if idx < len(pose):
            simplified["pose"][name] = pose[idx]
        else:
            simplified["pose"][name] = [0, 0, 0]
    return simplified

def simplify_file(file_path, output_path):
    with open(file_path) as f:
        data = json.load(f)

    simplified_data = [simplify_frame(frame) for frame in data]

    with open(output_path, "w") as f:
        json.dump(simplified_data, f, indent=2)

def batch_process():
    files = [f for f in os.listdir(INPUT_FOLDER) if f.endswith(".json")]
    print(f"🔄 Processing {len(files)} files...")

    for filename in files:
        input_path = os.path.join(INPUT_FOLDER, filename)
        output_path = os.path.join(OUTPUT_FOLDER, filename)
        try:
            simplify_file(input_path, output_path)
        except Exception as e:
            print(f"❌ Failed to process {filename}: {e}")
        else:
            print(f"✅ {filename}")

    print("✅ All files processed.")

if __name__ == "__main__":
    batch_process()
