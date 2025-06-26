# backend/translator/generate_gloss_video_map.py

import json
import os
import csv

WLASL_JSON = os.path.join(os.path.dirname(__file__), "WLASL_v0.3.json")
RAW_VIDEO_DIR = os.path.join(os.path.dirname(__file__), "raw_videos")
CSV_OUTPUT = os.path.join(os.path.dirname(__file__), "gloss_video_map.csv")

def generate_csv():
    with open(WLASL_JSON, "r") as f:
        data = json.load(f)

    rows = []

    for entry in data:
        gloss = entry["gloss"].upper()

        for inst in entry.get("instances", []):
            video_id = inst.get("video_id")            # "38183"
            youtube_url = inst.get("url", "")          # "https://youtube.com/watch?v=__bh7QCaDsw"
            youtube_id = youtube_url.split("v=")[-1] if "v=" in youtube_url else None

            file_candidates = []

            if video_id:
                file_candidates.append(f"{video_id}.mp4")
            if youtube_id:
                file_candidates.append(f"{youtube_id}.mp4")

            found = False
            for filename in file_candidates:
                full_path = os.path.join(RAW_VIDEO_DIR, filename)
                if os.path.exists(full_path):
                    rows.append([filename.replace(".mp4", ""), gloss])
                    found = True
                    break  # use first match

            if not found:
                print(f"⚠️ Missing video for gloss '{gloss}': {file_candidates}")

    with open(CSV_OUTPUT, "w", newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["video_id", "gloss"])
        writer.writerows(rows)

    print(f"✅ Generated: {CSV_OUTPUT} with {len(rows)} entries")

if __name__ == "__main__":
    generate_csv()
