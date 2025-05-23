from sqlalchemy import create_engine, text
from models import Base

DATABASE_URL = "postgresql://postgres:##8888@localhost/asl_app"
engine = create_engine(DATABASE_URL)

# Create tables if not exist
Base.metadata.create_all(bind=engine)

# Add new columns manually
with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS total_translations INTEGER DEFAULT 0;
    """))
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS total_predictions INTEGER DEFAULT 0;
    """))
    print("✅ Columns added.")
