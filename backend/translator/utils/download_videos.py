import os
import json
import requests
from tqdm import tqdm

def download_video(url, save_path):
    try:
        r = requests.get(url, stream=True)
        with open(save_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    except Exception as e:
        print(f"Failed to download {url}: {e}")

def download_sample_videos(json_path, out_dir, n=5):
    os.makedirs(out_dir, exist_ok=True)
    with open(json_path, 'r') as f:
        data = json.load(f)

    count = 0
    for entry in data:
        for instance in entry['instances']:
            url = instance['url']
            name = f"{entry['gloss']}_{instance['video_id']}.mp4"
            save_path = os.path.join(out_dir, name)
            if url.endswith(".mp4"):
                print(f"Downloading: {name}")
                download_video(url, save_path)
                count += 1
            if count >= n:
                return

# Example usage
if __name__ == "__main__":
    download_sample_videos("WLASL_with_expanded_complexity.json", "data/videos", n=5)
