from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, UniqueConstraint, Date, Table, func
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


learned_flashcard_tag_association = Table(
    "learned_flashcard_tags",
    Base.metadata,
    Column("learned_flashcard_id", ForeignKey("learned_flashcards.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True)
)

incorrect_answer_tag_association = Table(
    "incorrect_answer_tags",
    Base.metadata,
    Column("incorrect_answer_id", ForeignKey("incorrect_answers.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True)
)

daily_practice_tag_association = Table(
    "daily_practice_tags",
    Base.metadata,
    Column("daily_practice_id", ForeignKey("daily_practices.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True)
)


tag_association_table = Table(
    "flashcard_tags",
    Base.metadata,
    Column("flashcard_id", ForeignKey("flashcards.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True)
)


class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    flashcards = relationship("Flashcard", secondary=tag_association_table, back_populates="tags")
    learned_flashcards = relationship("LearnedFlashcard", secondary=learned_flashcard_tag_association, back_populates="tags")
    incorrect_answers = relationship("IncorrectAnswer", secondary=incorrect_answer_tag_association, back_populates="tags")
    daily_practices = relationship("DailyPractice", secondary=daily_practice_tag_association, back_populates="tags")

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
    flashcard_feedback = relationship("FlashcardFeedback", back_populates="user")
    quiz_results = relationship("QuizResult", back_populates="user")
    progress = relationship("UserProgress", back_populates="user")
    learned_flashcards = relationship("LearnedFlashcard", back_populates="user")
    incorrect_answers = relationship("IncorrectAnswer", back_populates="user")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")
    daily_practices = relationship("DailyPractice", back_populates="user", cascade="all, delete-orphan")

class FlashcardPrediction(Base):
    __tablename__ = "flashcard_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    prediction = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")
    


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    gloss = Column(String, index=True)
    video_url = Column(String)
    complexity = Column(Integer)

    feedback = relationship("FlashcardFeedback", back_populates="flashcard")
    daily_practices = relationship("DailyPractice", back_populates="flashcard", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=tag_association_table, back_populates="flashcards")
class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    level = Column(Integer)
    score = Column(Integer)
    total_questions = Column(Integer)
    correct_answers = Column(Integer)
    passed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quiz_results")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    current_level = Column(Integer, default=1)
    total_quizzes = Column(Integer, default=0)
    total_correct = Column(Integer, default=0)
    last_score = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress")

class LearnedFlashcard(Base):
    __tablename__ = "learned_flashcards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    flashcard_id = Column(Integer, ForeignKey("flashcards.id"))
    learned_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint('user_id', 'flashcard_id', name='uq_user_flashcard'),)

    user = relationship("User", back_populates="learned_flashcards")
    tags = relationship("Tag", secondary=learned_flashcard_tag_association, back_populates="learned_flashcards")

class IncorrectAnswer(Base):
    __tablename__ = "incorrect_answers"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    flashcard_gloss = Column(String, ForeignKey("flashcards.gloss"))
    
    selected_answer = Column(String)
    correct_answer = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)  

    user = relationship("User", back_populates="incorrect_answers")
    flashcard = relationship("Flashcard")
    tags = relationship("Tag", secondary=incorrect_answer_tag_association, back_populates="incorrect_answers")
    
    

class FlashcardFeedback(Base):
    __tablename__ = "flashcard_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    flashcard_id = Column(Integer, ForeignKey("flashcards.id"))
    liked = Column(Boolean)

    flashcard = relationship("Flashcard", back_populates="feedback")
    user = relationship("User", back_populates="flashcard_feedback")

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    remind_at = Column(DateTime)
    sent = Column(Boolean, default=False)

    user = relationship("User", back_populates="reminders")

class DailyPractice(Base):
    __tablename__ = "daily_practices"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    flashcard_id = Column(Integer, ForeignKey("flashcards.id"))
    practice_date = Column(Date)
    completed = Column(Boolean, default=False)

    user = relationship("User", back_populates="daily_practices")
    flashcard = relationship("Flashcard", back_populates="daily_practices")
    tags = relationship("Tag", secondary=daily_practice_tag_association, back_populates="daily_practices")