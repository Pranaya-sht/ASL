import cv2
import os
import pandas as pd
from tqdm import tqdm

VIDEO_DIR = 'raw_videos'
FRAME_DIR = 'video_frames'
NUM_FRAMES = 16
INDEX_CSV = 'dataset_index.csv'

def extract_frames(video_path, save_dir, num_frames):
    cap = cv2.VideoCapture(video_path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    interval = max(1, total // num_frames)

    frames = []
    count = 0
    saved = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if count % interval == 0 and saved < num_frames:
            frames.append(frame)
            saved += 1
        count += 1

    cap.release()

    # Save the frames
    basename = os.path.splitext(os.path.basename(video_path))[0]
    video_folder = os.path.join(save_dir, basename)
    os.makedirs(video_folder, exist_ok=True)

    for idx, frame in enumerate(frames):
        cv2.imwrite(os.path.join(video_folder, f"{idx:03d}.jpg"), frame)

def run():
    os.makedirs(FRAME_DIR, exist_ok=True)
    df = pd.read_csv(INDEX_CSV)

    for _, row in tqdm(df.iterrows(), total=len(df)):
        extract_frames(row['video_path'], FRAME_DIR, NUM_FRAMES)

if __name__ == '__main__':
    run()
