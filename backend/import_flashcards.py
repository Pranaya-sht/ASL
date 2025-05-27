from database import SessionLocal, engine
from models import Flashcard, Base
import json
from sqlalchemy.orm import Session

# Create the DB tables
Base.metadata.create_all(bind=engine)

# Load the dataset
with open("WLASL_with_expanded_complexity.json", "r") as f:
    data = json.load(f)

db: Session = SessionLocal()

# Insert each flashcard
for entry in data:
    gloss = entry["gloss"]
    complexity = entry["complexity"]
    instances = entry.get("instances", [])

    for instance in instances:
        video_url = instance.get("url")
        if not video_url:
            continue
        flashcard = Flashcard(gloss=gloss, video_url=video_url, complexity=complexity)
        db.add(flashcard)

db.commit()
db.close()
print("✅ Flashcards imported successfully.")
