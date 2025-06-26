import csv
import os

# Paths
BASE_DIR = os.path.dirname(__file__)
CSV_PATH = os.path.join(BASE_DIR, "gloss_video_map.csv")
RAW_VIDEO_DIR = os.path.join(BASE_DIR, "raw_videos")

# Output mappings
GLOSS_VIDEO_MAP = {}
VIDEO_ID_TO_PATH = {}

def load_gloss_video_map():
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"CSV not found at {CSV_PATH}")

    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            gloss = row["gloss"].strip().upper()
            video_id = row["video_id"].strip()
            video_filename = f"{video_id}.mp4"
            full_video_path = os.path.join(RAW_VIDEO_DIR, video_filename)
            relative_path = f"raw_videos/{video_filename}"

            if os.path.exists(full_video_path):
                # print(f"✅ Found video: {video_filename} for gloss: {gloss}")
                GLOSS_VIDEO_MAP.setdefault(gloss, []).append(relative_path)
                VIDEO_ID_TO_PATH[video_id] = full_video_path
            else:
                print(f"❌ Skipped: {video_filename} (not found) for gloss: {gloss}")

# Load mappings at import
load_gloss_video_map()
