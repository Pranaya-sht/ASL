# import_flashcard_optimized.py

from database import SessionLocal, engine
from models import Flashcard, Base
import json
from sqlalchemy.orm import Session
from sqlalchemy import select

# Create the DB tables (only if you want to create tables here)
Base.metadata.create_all(bind=engine)

# Load the dataset
with open("WLASL_enhanced_with_complexity_tags.json", "r") as f:
    data = json.load(f)

db: Session = SessionLocal()

try:
    # STEP 1: Pre-fetch all existing URLs from database (single query)
    existing_urls = {url for (url,) in db.query(Flashcard.video_url).all()}
    
    # STEP 2: Prepare new flashcards with deduplication
    seen_urls = set()
    new_flashcards = []
    duplicate_count = 0
    new_count = 0
    
    total_entries = len(data)
    for idx, entry in enumerate(data):
        if idx % 500 == 0:  # Progress logging
            print(f"Processing entry {idx}/{total_entries}...")
            
        gloss = entry.get("gloss")
        complexity = entry.get("complexity")
        instances = entry.get("instances", [])
        
        for instance in instances:
            video_url = instance.get("url")
            if not video_url:
                continue
                
            # Skip if URL exists in DB or current dataset
            if video_url in existing_urls or video_url in seen_urls:
                duplicate_count += 1
                continue
                
            seen_urls.add(video_url)
            new_flashcards.append({
                "gloss": gloss,
                "video_url": video_url,
                "complexity": complexity
            })
            new_count += 1

    # STEP 3: Bulk insert all new flashcards
    if new_flashcards:
        db.bulk_insert_mappings(Flashcard, new_flashcards)
        db.commit()
    
    print(f"✅ Import completed: {new_count} new flashcards added | {duplicate_count} duplicates skipped")
    print(f"Total processed: {len(seen_urls)} URLs")

except Exception as e:
    db.rollback()
    print(f"❌ Error during import: {str(e)}")
    import traceback
    traceback.print_exc()

finally:
    db.close()