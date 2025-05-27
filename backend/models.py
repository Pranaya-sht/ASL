# models.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
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
    timestamp = Column(DateTime, default=datetime.utcnow)  # Add this field
    user = relationship("User", back_populates="predictions")

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    gloss = Column(String, index=True)
    video_url = Column(String)
    complexity = Column(Integer)
    



class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # adjust if your user table has a different name
    level = Column(Integer)
    score = Column(Integer)
    total_questions = Column(Integer)
    correct_answers = Column(Integer)
    passed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    current_level = Column(Integer, default=1)
    total_quizzes = Column(Integer, default=0)
    total_correct = Column(Integer, default=0)
    last_score = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
class LearnedFlashcard(Base):
    __tablename__ = "learned_flashcards"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    flashcard_id = Column(Integer, ForeignKey("flashcards.id"))
    learned_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (UniqueConstraint('user_id', 'flashcard_id', name='uq_user_flashcard'),)

class IncorrectAnswer(Base):
    __tablename__ = "incorrect_answers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    flashcard_gloss = Column(String)
    selected_answer = Column(String)
    correct_answer = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
