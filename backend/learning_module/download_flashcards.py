import os
import requests

videos = {
    "book": "http://aslbricks.org/New/ASL-Videos/book.mp4",
    "read": "http://aslbricks.org/New/ASL-Videos/read.mp4",
    "school": "http://aslbricks.org/New/ASL-Videos/school.mp4",
    "learn": "http://aslbricks.org/New/ASL-Videos/learn.mp4",
    "write": "http://aslbricks.org/New/ASL-Videos/write.mp4",
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                  "(KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36"
}

os.makedirs("flashcards", exist_ok=True)

for word, url in videos.items():
    filename = f"flashcards/{word}.mp4"
    print(f"⬇ Downloading {word}...")

    try:
        with requests.get(url, headers=headers, stream=True, timeout=10) as r:
            r.raise_for_status()  # Raise error for bad status
            with open(filename, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
        print(f"✅ Saved to {filename}")
    except Exception as e:
        print(f"❌ Failed to download {word}: {e}")
