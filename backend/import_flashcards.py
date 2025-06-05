from database import SessionLocal, engine
from models import Flashcard, Tag, Base
import json
import requests
import re
from sqlalchemy.orm import Session
from concurrent.futures import ThreadPoolExecutor, as_completed

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Load the dataset
with open("WLASL_enhanced_with_complexity_tags.json", "r") as f:
    data = json.load(f)

db: Session = SessionLocal()

def is_url_valid(session, url):
    """
    Checks if a URL is reachable and valid using a HEAD request with fallback to GET.
    """
    try:
        if not re.match(r'^https?://', url):
            return False

        response = session.head(url, allow_redirects=True, timeout=5)
        if response.status_code == 200:
            return True

        response = session.get(url, stream=True, timeout=5)
        return response.status_code == 200
    except requests.RequestException:
        return False

# Number of concurrent workers
max_workers = 50

try:
    # Fetch existing data
    existing_urls = {url for (url,) in db.query(Flashcard.video_url).all()}
    existing_tags = {t.name: t for t in db.query(Tag).all()}

    seen_urls = set()
    urls_to_check = []
    url_to_flashcard_data = {}

    duplicate_count = 0
    total_entries = len(data)

    for idx, entry in enumerate(data):
        if idx % 500 == 0:
            print(f"Processing entry {idx}/{total_entries}...")

        gloss = entry.get("gloss")
        complexity = entry.get("complexity")
        tag_dict = entry.get("tags", {})
        tags = [v.strip() for v in tag_dict.values() if isinstance(v, str) and v.strip()]
        instances = entry.get("instances", [])

        for instance in instances:
            video_url = instance.get("url")
            if not video_url:
                continue

            if video_url in existing_urls or video_url in seen_urls:
                duplicate_count += 1
                continue

            seen_urls.add(video_url)
            urls_to_check.append(video_url)
            url_to_flashcard_data[video_url] = {
                "gloss": gloss,
                "video_url": video_url,
                "complexity": complexity,
                "tags": tags
            }

    print(f"🔍 Checking {len(urls_to_check)} URLs for validity...")

    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(pool_connections=max_workers, pool_maxsize=max_workers)
    session.mount('http://', adapter)
    session.mount('https://', adapter)

    valid_urls = set()
    invalid_count = 0

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(is_url_valid, session, url): url for url in urls_to_check}
        for idx, future in enumerate(as_completed(futures), start=1):
            url = futures[future]
            try:
                if future.result():
                    valid_urls.add(url)
                else:
                    invalid_count += 1
            except Exception:
                invalid_count += 1

            if idx % 1000 == 0:
                print(f"🔎 Checked {idx}/{len(urls_to_check)} URLs so far...")

    session.close()

    # Insert valid flashcards and their tags
    new_flashcards_count = 0
    for url in valid_urls:
        flashcard_data = url_to_flashcard_data[url]
        flashcard = Flashcard(
            gloss=flashcard_data["gloss"],
            video_url=flashcard_data["video_url"],
            complexity=flashcard_data["complexity"]
        )

        for tag_name in flashcard_data["tags"]:
            tag_name = tag_name.strip()
            if not tag_name:
                continue

            if tag_name not in existing_tags:
                tag = Tag(name=tag_name)
                db.add(tag)
                db.flush()
                existing_tags[tag_name] = tag

            flashcard.tags.append(existing_tags[tag_name])

        db.add(flashcard)
        new_flashcards_count += 1

    db.commit()

    print(f"✅ Import completed:")
    print(f"   ➕ {new_flashcards_count} new flashcards added")
    print(f"   🔁 {duplicate_count} duplicates skipped")
    print(f"   ❌ {invalid_count} invalid URLs skipped")
    print(f"   📦 Total valid URLs processed: {len(valid_urls)}")

except Exception as e:
    db.rollback()
    print(f"❌ Error during import: {str(e)}")
    import traceback
    traceback.print_exc()

finally:
    db.close()
