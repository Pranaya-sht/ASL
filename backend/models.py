# models.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    profile_image_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)

    # ASL learning stats
    lessons_completed = Column(Integer, default=0)
    words_learned = Column(Integer, default=0)
    total_learning_minutes = Column(Integer, default=0)
    total_translations = Column(Integer, default=0)
    total_predictions = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    predictions = relationship("FlashcardPrediction", back_populates="user")

class FlashcardPrediction(Base):
    __tablename__ = "flashcard_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    prediction = Column(String, nullable=False)

    user = relationship("User", back_populates="predictions")
