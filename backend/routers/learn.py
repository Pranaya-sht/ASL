from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import (
    Flashcard,
    QuizResult,
    User,
    UserProgress,
    LearnedFlashcard,
    IncorrectAnswer,
    FlashcardFeedback,
    DailyPractice,
    Reminder
)
from auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/learn", tags=["Learn"])


@router.get("/api/flashcards/level/{level}")
def get_flashcards_by_level(
    level: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1),
    limit: int = Query(12),
    only_unlearned: bool = Query(False)
):
    offset = (page - 1) * limit
    learned_ids = db.query(LearnedFlashcard.flashcard_id).filter_by(user_id=current_user.id).all()
    learned_set = {row[0] for row in learned_ids}

    query = db.query(Flashcard).filter(Flashcard.complexity == level)
    if only_unlearned:
        query = query.filter(~Flashcard.id.in_(learned_set))

    flashcards = query.offset(offset).limit(limit).all()

    return [
        {
            "id": f.id,
            "gloss": f.gloss,
            "video_url": f.video_url,
            "learned": f.id in learned_set
        }
        for f in flashcards
    ]


@router.get("/api/quiz/level/{level}")
def get_quiz_for_level(level: int, db: Session = Depends(get_db)):
    all_flashcards = db.query(Flashcard).filter(Flashcard.complexity == level).all()
    unique_glosses = {}
    for f in all_flashcards:
        if f.gloss not in unique_glosses:
            unique_glosses[f.gloss] = f

    all_flashcards = list(unique_glosses.values())
    if len(all_flashcards) < 4:
        return {"error": "Not enough flashcards for a quiz."}

    correct_cards = random.sample(all_flashcards, min(10, len(all_flashcards)))
    quiz_questions = []

    for correct in correct_cards:
        wrong_options = [fc.gloss for fc in all_flashcards if fc.gloss != correct.gloss]
        choices = random.sample(wrong_options, 3)
        choices.append(correct.gloss)
        random.shuffle(choices)

        quiz_questions.append({
            "video_url": correct.video_url,
            "options": choices,
            "correct_answer": correct.gloss
        })

    return quiz_questions


class QuizSubmission(BaseModel):
    level: int
    answers: List[dict]


@router.post("/api/quiz/submit")
def submit_quiz(
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    correct_count = sum(1 for ans in submission.answers if ans.get("correct"))
    score = int((correct_count / len(submission.answers)) * 100)
    passed = score >= 70

    result = QuizResult(
        user_id=current_user.id,
        level=submission.level,
        score=score,
        total_questions=len(submission.answers),
        correct_answers=correct_count,
        passed=passed
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    progress = db.query(UserProgress).filter_by(user_id=current_user.id).first()
    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            total_quizzes=0,
            total_correct=0,
            current_level=1
        )

    progress.total_quizzes += 1
    progress.total_correct += correct_count
    progress.last_score = score
    progress.updated_at = datetime.utcnow()

    if passed and submission.level >= progress.current_level:
        progress.current_level = submission.level + 1

    db.add(progress)
    db.commit()

    for ans in submission.answers:
        if not ans.get("correct"):
            wrong = IncorrectAnswer(
                user_id=current_user.id,
                flashcard_gloss=ans["question"],
                selected_answer=ans["selected"],
                correct_answer=ans["question"]
            )
            db.add(wrong)
            db.commit()

    return {
        "message": "Quiz submitted successfully",
        "score": score,
        "passed": passed,
        "correct": correct_count,
        "total": len(submission.answers),
        "result_id": result.id
    }


@router.get("/api/user/progress")
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.query(UserProgress).filter_by(user_id=current_user.id).first()

    if not progress:
        return {"message": "No progress found."}

    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "current_level": progress.current_level,
        "total_quizzes": progress.total_quizzes,
        "total_correct": progress.total_correct,
        "last_score": progress.last_score,
        "updated_at": progress.updated_at,
    }


@router.post("/api/flashcards/{flashcard_id}/learned")
def mark_flashcard_learned(flashcard_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(LearnedFlashcard).filter_by(user_id=current_user.id, flashcard_id=flashcard_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "removed"}
    new_record = LearnedFlashcard(user_id=current_user.id, flashcard_id=flashcard_id)
    db.add(new_record)
    db.commit()
    return {"status": "learned"}


@router.get("/api/quiz/incorrect")
def get_incorrect_answers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incorrects = (
        db.query(IncorrectAnswer)
        .filter(IncorrectAnswer.user_id == current_user.id)
        .order_by(IncorrectAnswer.timestamp.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "flashcard_gloss": ia.flashcard_gloss,
            "selected_answer": ia.selected_answer,
            "correct_answer": ia.correct_answer,
            "timestamp": ia.timestamp,
            "video_url": db.query(Flashcard.video_url).filter(Flashcard.gloss == ia.flashcard_gloss).first()[0] if db.query(Flashcard.video_url).filter(Flashcard.gloss == ia.flashcard_gloss).first() else None
        }
        for ia in incorrects
    ]


@router.post("/api/flashcards/reset")
def reset_learned_flashcards(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(LearnedFlashcard).filter(LearnedFlashcard.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All learned flashcards reset."}


class FeedbackModel(BaseModel):
    liked: bool


@router.post("/api/flashcards/{flashcard_id}/feedback")
def feedback_flashcard(flashcard_id: int, feedback: FeedbackModel, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = db.query(FlashcardFeedback).filter_by(user_id=current_user.id, flashcard_id=flashcard_id).first()
    if entry:
        entry.liked = feedback.liked
    else:
        entry = FlashcardFeedback(user_id=current_user.id, flashcard_id=flashcard_id, liked=feedback.liked)
        db.add(entry)
    db.commit()
    return {"status": "feedback updated"}


@router.get("/api/user/analytics")
def get_user_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz_scores = (
        db.query(QuizResult.created_at, QuizResult.score)
        .filter(QuizResult.user_id == current_user.id)
        .order_by(QuizResult.created_at.desc())
        .limit(10)
        .all()
    )

    learned_counts = (
        db.query(Flashcard.complexity, func.count(LearnedFlashcard.id))
        .join(Flashcard, Flashcard.id == LearnedFlashcard.flashcard_id)
        .filter(LearnedFlashcard.user_id == current_user.id)
        .group_by(Flashcard.complexity)
        .all()
    )

    likes = db.query(func.count()).select_from(FlashcardFeedback).filter_by(user_id=current_user.id, liked=True).scalar()
    dislikes = db.query(func.count()).select_from(FlashcardFeedback).filter_by(user_id=current_user.id, liked=False).scalar()

    return {
        "quiz_scores": [{"date": q[0], "score": q[1]} for q in quiz_scores],
        "learned_flashcards_by_level": [{"level": row[0], "count": row[1]} for row in learned_counts],
        "likes": likes,
        "dislikes": dislikes
    }

class ReminderCreate(BaseModel):
    message: str
    remind_at: datetime

@router.post("/api/reminders")
def create_reminder(reminder: ReminderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_reminder = Reminder(
        user_id=current_user.id,
        message=reminder.message,
        remind_at=reminder.remind_at,
        sent=False
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    return {"message": "Reminder created", "reminder_id": new_reminder.id}

@router.get("/api/reminders/upcoming")
def get_upcoming_reminders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.utcnow()
    reminders = (
        db.query(Reminder)
        .filter(Reminder.user_id == current_user.id, Reminder.remind_at >= now, Reminder.sent == False)
        .order_by(Reminder.remind_at)
        .all()
    )
    return [
        {
            "id": r.id,
            "message": r.message,
            "remind_at": r.remind_at
        }
        for r in reminders
    ]

@router.post("/api/reminders/{reminder_id}/mark_sent")
def mark_reminder_sent(reminder_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    reminder.sent = True
    db.commit()
    return {"message": "Reminder marked as sent"}


# -------------- DAILY PRACTICE --------------

@router.get("/api/daily-practice")
def get_daily_practice(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.utcnow().date()

    # Check if daily practice already generated for today
    existing_practice = db.query(DailyPractice).filter_by(user_id=current_user.id, practice_date=today).all()

    if existing_practice:
        flashcards = [db.query(Flashcard).filter(Flashcard.id == dp.flashcard_id).first() for dp in existing_practice]
    else:
        # If not generated, pick 5 random flashcards from current level or lower
        progress = db.query(UserProgress).filter_by(user_id=current_user.id).first()
        current_level = progress.current_level if progress else 1

        flashcards_query = (
            db.query(Flashcard)
            .filter(Flashcard.complexity <= current_level)
            .all()
        )

        if len(flashcards_query) == 0:
            return {"message": "No flashcards available for practice today."}

        flashcards = random.sample(flashcards_query, min(5, len(flashcards_query)))

        # Save daily practice records
        for fc in flashcards:
            dp = DailyPractice(user_id=current_user.id, flashcard_id=fc.id, practice_date=today, completed=False)
            db.add(dp)
        db.commit()

    return [
        {
            "id": f.id,
            "gloss": f.gloss,
            "video_url": f.video_url
        }
        for f in flashcards
    ]

class DailyPracticeComplete(BaseModel):
    flashcard_id: int

@router.post("/api/daily-practice/complete")
def complete_daily_practice(entry: DailyPracticeComplete, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.utcnow().date()
    dp_entry = db.query(DailyPractice).filter_by(
        user_id=current_user.id,
        flashcard_id=entry.flashcard_id,
        practice_date=today
    ).first()

    if not dp_entry:
        raise HTTPException(status_code=404, detail="Daily practice entry not found for today")

    dp_entry.completed = True
    db.commit()
    return {"message": "Practice marked as completed"}


# -------------- DICTIONARY --------------

@router.get("/api/dictionary/search")
def search_dictionary(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(10)
):
    flashcards = (
        db.query(Flashcard)
        .filter(Flashcard.gloss.ilike(f"%{query}%"))
        .limit(limit)
        .all()
    )
    if not flashcards:
        return {"message": "No entries found"}

    return [
        {
            "id": f.id,
            "gloss": f.gloss,
            "video_url": f.video_url,
            "complexity": f.complexity
        }
        for f in flashcards
    ]