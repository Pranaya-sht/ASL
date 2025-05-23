import json
import csv
import os

WLASL_JSON = 'WLASL_v0.3.json'
VIDEO_DIR = 'raw_videos'
OUTPUT_CSV = 'dataset_index.csv'

with open(WLASL_JSON, 'r') as f:
    data = json.load(f)

rows = []

for entry in data:
    label = entry['gloss']
    for inst in entry['instances']:
        video_id = inst['video_id']
        video_path = os.path.join(VIDEO_DIR, f'{video_id}.mp4')
        if os.path.exists(video_path):
            rows.append({'video_path': video_path, 'label': label})

with open(OUTPUT_CSV, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['video_path', 'label'])
    writer.writeheader()
    writer.writerows(rows)

print(f"Saved {len(rows)} entries to {OUTPUT_CSV}")
