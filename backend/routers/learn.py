from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer, Float, cast, case, literal_column
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
    Reminder,
    Tag,
    tag_association_table,
    daily_practice_tag_association,
    incorrect_answer_tag_association,
    learned_flashcard_tag_association,
    
)
from auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random
from sqlalchemy import union_all, literal

router = APIRouter(prefix="/learn", tags=["Learn"])


# ------------------ FLASHCARDS ------------------

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

    total_count = query.count()
    flashcards = query.offset(offset).limit(limit).all()

    return {
        "total": total_count,
        "flashcards": [
            {
                "id": f.id,
                "gloss": f.gloss,
                "video_url": f.video_url,
                "learned": f.id in learned_set,
                "tags": [tag.name for tag in f.tags],
                "complexity": f.complexity
            }
            for f in flashcards
        ]
    }

# ------------------ QUIZ ------------------

@router.get("/api/quiz/level/{level}")
def get_quiz_for_level(level: int, db: Session = Depends(get_db)):
    all_flashcards = db.query(Flashcard).filter(Flashcard.complexity == level).all()
    unique_glosses = {f.gloss: f for f in all_flashcards}

    all_flashcards = list(unique_glosses.values())
    if len(all_flashcards) < 4:
        return {"error": "Not enough flashcards for a quiz."}

    correct_cards = random.sample(all_flashcards, min(10, len(all_flashcards)))
    quiz_questions = []

    for correct in correct_cards:
        wrong_options = [fc.gloss for fc in all_flashcards if fc.gloss != correct.gloss]
        choices = random.sample(wrong_options, min(3, len(wrong_options)))
        choices.append(correct.gloss)
        random.shuffle(choices)

        quiz_questions.append({
            "video_url": correct.video_url,
            "options": choices,
            "correct_answer": correct.gloss
        })

    return quiz_questions



class QuizAnswer(BaseModel):
    flashcard_id: int
    selected: str
    question: str
    correct: bool

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
# ------------------ USER PROGRESS ------------------

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

# ------------------ LEARNED FLASHCARDS ------------------

@router.post("/api/flashcards/{flashcard_id}/learned")
def mark_flashcard_learned(
    flashcard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(LearnedFlashcard).filter_by(user_id=current_user.id, flashcard_id=flashcard_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "removed"}
    new_record = LearnedFlashcard(user_id=current_user.id, flashcard_id=flashcard_id)
    db.add(new_record)
    db.commit()
    return {"status": "learned"}

@router.post("/api/flashcards/reset")
def reset_learned_flashcards(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(LearnedFlashcard).filter(LearnedFlashcard.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All learned flashcards reset."}

@router.get("/api/quiz/incorrect")
def get_user_incorrect_answers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incorrect_answers = (
        db.query(IncorrectAnswer, Flashcard)
        .join(Flashcard, Flashcard.gloss == IncorrectAnswer.flashcard_gloss)
        .filter(IncorrectAnswer.user_id == current_user.id)
        .order_by(IncorrectAnswer.created_at.desc())
        .all()
    )

    return [{
        "flashcard_id": fc.id,
        "gloss": fc.gloss,
        "video_url": fc.video_url,
        "tags": [tag.name for tag in fc.tags],
        "selected_answer": incorrect.selected_answer,  # Added this
        "correct_answer": incorrect.correct_answer,    # Added this
        "timestamp": incorrect.created_at              # Changed from incorrect_at to timestamp
    } for incorrect, fc in incorrect_answers]
@router.delete("/api/quiz/incorrect/clear")
def clear_incorrect_answers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deleted_count = db.query(IncorrectAnswer).filter(IncorrectAnswer.user_id == current_user.id).delete()
    db.commit()
    return {"message": f"Cleared {deleted_count} incorrect answer(s)."}


class FeedbackModel(BaseModel):
    liked: bool


@router.post("/api/flashcards/{flashcard_id}/feedback")
def feedback_flashcard(
    flashcard_id: int,
    feedback: FeedbackModel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(FlashcardFeedback).filter_by(user_id=current_user.id, flashcard_id=flashcard_id).first()

    # If user clicks the same button again (toggle off), remove feedback
    if entry:
        if entry.liked == feedback.liked:
            db.delete(entry)
            db.commit()
            return {"status": "feedback removed"}
        else:
            entry.liked = feedback.liked
            db.commit()
            return {"status": "feedback updated"}
    else:
        entry = FlashcardFeedback(
            user_id=current_user.id,
            flashcard_id=flashcard_id,
            liked=feedback.liked
        )
        db.add(entry)
        db.commit()
        return {"status": "feedback created"}

# ------------------ USER ANALYTICS ------------------

@router.get("/api/user/analytics")
def get_user_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id

    # Last 10 quiz scores
    quiz_scores = (
        db.query(QuizResult.created_at, QuizResult.score)
        .filter(QuizResult.user_id == user_id)
        .order_by(QuizResult.created_at.desc())
        .limit(10)
        .all()
    )

    # Learned flashcards by complexity level
    learned_counts = (
        db.query(Flashcard.complexity, func.count(LearnedFlashcard.id))
        .join(LearnedFlashcard, LearnedFlashcard.flashcard_id == Flashcard.id)
        .filter(LearnedFlashcard.user_id == user_id)
        .group_by(Flashcard.complexity)
        .all()
    )

    # Learned flashcards grouped by tag
    # Learned flashcards grouped by tag
    learned_tags = (
        db.query(Tag.name, func.count(Tag.id))
        .join(Flashcard.tags)
        .join(LearnedFlashcard, LearnedFlashcard.flashcard_id == Flashcard.id)
        .filter(LearnedFlashcard.user_id == current_user.id)
        .group_by(Tag.name)
        .all()
    )

    # Daily practice flashcards grouped by tag
    practice_tags = (
        db.query(Tag.name, func.count(Tag.id))
        .join(Flashcard.tags)
        .join(DailyPractice, DailyPractice.flashcard_id == Flashcard.id)
        .filter(DailyPractice.user_id == current_user.id)
        .group_by(Tag.name)
        .all()
    )


    # Incorrect answers grouped by tag
    incorrect_tags = (
        db.query(Tag.name, func.count(Tag.id))
        .join(Flashcard.tags)
        .join(IncorrectAnswer, IncorrectAnswer.flashcard_gloss == Flashcard.gloss)
        .filter(IncorrectAnswer.user_id == current_user.id)
        .group_by(Tag.name)
        .all()
    )

    # Likes and dislikes count
    likes = (
        db.query(func.count())
        .select_from(FlashcardFeedback)
        .filter(FlashcardFeedback.user_id == user_id, FlashcardFeedback.liked.is_(True))
        .scalar()
    ) or 0

    dislikes = (
        db.query(func.count())
        .select_from(FlashcardFeedback)
        .filter(FlashcardFeedback.user_id == user_id, FlashcardFeedback.liked.is_(False))
        .scalar()
    ) or 0
# Learned tags grouped by level
    learned_tags_by_level = (
        db.query(
            Flashcard.complexity.label("level"),
            Tag.name.label("tag"),
            func.count(LearnedFlashcard.id).label("count")
        )
        .join(LearnedFlashcard, LearnedFlashcard.flashcard_id == Flashcard.id)
        .join(Flashcard.tags)
        .filter(LearnedFlashcard.user_id == user_id)
        .group_by(Flashcard.complexity, Tag.name)
        .all()
    )

    # Feedback by level (likes/dislikes)
    feedback_by_level = (
        db.query(
            Flashcard.complexity,
            func.sum(case((FlashcardFeedback.liked == True, 1), else_=0)).label('likes'),
            func.sum(case((FlashcardFeedback.liked == False, 1), else_=0)).label('dislikes')
        )
        .join(FlashcardFeedback, FlashcardFeedback.flashcard_id == Flashcard.id)
        .filter(FlashcardFeedback.user_id == user_id)
        .group_by(Flashcard.complexity)
        .all()
    )

    # Incorrect answers by level
    incorrect_by_level = (
        db.query(Flashcard.complexity, func.count(IncorrectAnswer.id))
        .join(Flashcard, Flashcard.gloss == IncorrectAnswer.flashcard_gloss)
        .filter(IncorrectAnswer.user_id == user_id)
        .group_by(Flashcard.complexity)
        .all()
    )

    # Quiz performance by level
    quiz_performance = (
        db.query(
            QuizResult.level,
            func.avg(QuizResult.score).label('average_score'),
            func.max(QuizResult.score).label('best_score'),
            func.count(QuizResult.id).label('attempts')
        )
        .filter(QuizResult.user_id == user_id)
        .group_by(QuizResult.level)
        .all()
    )

    # Daily practice stats
    daily_practice_stats = (
        db.query(
            func.count(DailyPractice.id).label('total_practices'),
            func.sum(case((DailyPractice.completed == True, 1), else_=0)).label('completed_practices'),
            func.avg(cast(case((DailyPractice.completed == True, 1), else_=0), Float)).label("completion_rate")
        )
        .filter(DailyPractice.user_id == user_id)
        .first()
    )

    # Reminder stats
    reminder_stats = (
        db.query(
            func.count().label('total_reminders'),
            func.sum(case((Reminder.sent == True, 1), else_=0)).label('sent_reminders'),
            func.sum(case((Reminder.sent == False, 1), else_=0)).label('pending_reminders')
        )
        .filter(Reminder.user_id == user_id)
        .first()
    )

    # Progress timeline (last 30 days)
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=30)

    learned_subq = (
        db.query(
            func.date(LearnedFlashcard.learned_at).label("date"),
            literal("learned").label("type"),
            func.count(LearnedFlashcard.id).label("count")
        )
        .filter(
            LearnedFlashcard.user_id == user_id,
            func.date(LearnedFlashcard.learned_at) >= start_date
        )
        .group_by(func.date(LearnedFlashcard.learned_at))
    )

    practice_subq = (
        db.query(
            DailyPractice.practice_date.label("date"),
            literal("daily_practice").label("type"),
            func.count(DailyPractice.id).label("count")
        )
        .filter(
            DailyPractice.user_id == user_id,
            DailyPractice.practice_date >= start_date
        )
        .group_by(DailyPractice.practice_date)
    )

    incorrect_subq = (
        db.query(
            func.date(IncorrectAnswer.created_at).label("date"),
            literal("incorrect").label("type"),
            func.count(IncorrectAnswer.id).label("count")
        )
        .filter(
            IncorrectAnswer.user_id == user_id,
            func.date(IncorrectAnswer.created_at) >= start_date
        )
        .group_by(func.date(IncorrectAnswer.created_at))
    )

    quiz_subq = (
        db.query(
            func.date(QuizResult.created_at).label("date"),
            literal("quiz").label("type"),
            func.count(QuizResult.id).label("count")
        )
        .filter(
            QuizResult.user_id == user_id,
            func.date(QuizResult.created_at) >= start_date
        )
        .group_by(func.date(QuizResult.created_at))
    )

    reminder_subq = (
        db.query(
            func.date(Reminder.remind_at).label("date"),
            literal("reminder").label("type"),
            func.count(Reminder.id).label("count")
        )
        .filter(
            Reminder.user_id == user_id,
            func.date(Reminder.remind_at) >= start_date
        )
        .group_by(func.date(Reminder.remind_at))
    )

    union_query = union_all(
        learned_subq,
        practice_subq,
        incorrect_subq,
        quiz_subq,
        reminder_subq
    ).alias("combined")

    progress_timeline = (
        db.query(
            union_query.c.date,
            union_query.c.type,
            func.sum(union_query.c.count).label("activity_count")
        )
        .group_by(union_query.c.date, union_query.c.type)
        .order_by(union_query.c.date)
        .all()
    )

    return {
        "quiz_scores": [{"date": date.isoformat(), "score": score} for date, score in quiz_scores],
        "learned_flashcards_by_level": [{"level": level, "count": count} for level, count in learned_counts],
        "learned_tags": [{"tag": tag, "count": count} for tag, count in learned_tags],
        "daily_practice_tags": [{"tag": tag, "count": count} for tag, count in practice_tags],
        "incorrect_tags": [{"tag": tag, "count": count} for tag, count in incorrect_tags],
        "likes": likes,
        "dislikes": dislikes,
        "feedback_by_level": [
            {"level": level, "likes": like_count or 0, "dislikes": dislike_count or 0}
            for level, like_count, dislike_count in feedback_by_level
        ],
            "learned_tags_by_level": [
        {"level": level, "tag": tag, "count": count}
        for level, tag, count in learned_tags_by_level
    ],

        "incorrect_by_level": [
            {"level": level, "count": count}
            for level, count in incorrect_by_level
        ],
        "quiz_performance": [
            {
                "level": level,
                "average_score": round(float(avg_score or 0), 2),
                "best_score": best_score or 0,
                "attempts": attempts
            }
            for level, avg_score, best_score, attempts in quiz_performance
        ],
        "daily_practice_stats": {
            "total_practices": daily_practice_stats.total_practices or 0,
            "completed_practices": daily_practice_stats.completed_practices or 0,
            "completion_rate": round((daily_practice_stats.completion_rate or 0) * 100, 2),
        },
        "reminder_stats": {
            "total_reminders": reminder_stats.total_reminders or 0,
            "sent_reminders": reminder_stats.sent_reminders or 0,
            "pending_reminders": reminder_stats.pending_reminders or 0,
        },
        "progress_timeline": [
            {
                "date": date.isoformat(),
                "type": activity_type,
                "activity_count": count
            }
            for date, activity_type, count in progress_timeline
        ],
    }

# ------------------ REMINDERS ------------------
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



# ------------------ DAILY PRACTICE ------------------

@router.get("/api/daily-practice")
def get_daily_practice(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.utcnow().date()
    daily_practice_entries = db.query(DailyPractice).filter_by(user_id=current_user.id, practice_date=today).all()

    if not daily_practice_entries:
        progress = db.query(UserProgress).filter_by(user_id=current_user.id).first()
        current_level = progress.current_level if progress else 1
        flashcards_query = db.query(Flashcard).filter(Flashcard.complexity <= current_level).all()

        if not flashcards_query:
            return []

        selected_flashcards = random.sample(flashcards_query, min(5, len(flashcards_query)))
        for fc in selected_flashcards:
            dp = DailyPractice(user_id=current_user.id, flashcard_id=fc.id, practice_date=today, completed=False)
            db.add(dp)
        db.commit()
        daily_practice_entries = db.query(DailyPractice).filter_by(user_id=current_user.id, practice_date=today).all()

    results = []
    for dp in daily_practice_entries:
        flashcard = db.query(Flashcard).get(dp.flashcard_id)
        results.append({
            "id": flashcard.id,
            "gloss": flashcard.gloss,
            "video_url": flashcard.video_url,
            "tags": [tag.name for tag in flashcard.tags],
            "completed": dp.completed
        })

    return results


class DailyPracticeToggle(BaseModel):
    flashcard_id: int
    completed: bool  # true or false

@router.post("/api/daily-practice/complete")
def toggle_complete_daily_practice(
    entry: DailyPracticeToggle,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.utcnow().date()
    dp_entry = db.query(DailyPractice).filter_by(
        user_id=current_user.id,
        flashcard_id=entry.flashcard_id,
        practice_date=today
    ).first()

    if not dp_entry:
        raise HTTPException(status_code=404, detail="Daily practice entry not found for today")

    dp_entry.completed = entry.completed
    db.commit()
    return {"message": f"Practice marked as {'completed' if entry.completed else 'incomplete'}"}


# ------------------ DICTIONARY ------------------

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
            "complexity": f.complexity,
            "tags": [tag.name for tag in f.tags]
        }
        for f in flashcards
    ]

