# models.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)  # Store hashed password, not plaintext
    profile_image_url = Column(String, nullable=True)  # Link to image stored in S3 or similar
    bio = Column(Text, nullable=True)

    # ASL learning stats
    lessons_completed = Column(Integer, default=0)
    words_learned = Column(Integer, default=0)
    total_learning_minutes = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)