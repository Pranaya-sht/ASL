from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Flashcard, QuizResult, User, UserProgress,LearnedFlashcard,IncorrectAnswer
from auth import get_current_user
import random
from pydantic import BaseModel
from typing import List
from datetime import datetime
from schemas import QuizSubmission
from fastapi import Query

router = APIRouter(prefix="/learn", tags=["Learn"])

# ---------------------- Flashcards by Level ----------------------


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




# ---------------------- Quiz Endpoint ----------------------
@router.get("/api/quiz/level/{level}")
def get_quiz_for_level(level: int, db: Session = Depends(get_db)):
    all_flashcards = db.query(Flashcard).filter(Flashcard.complexity == level).all()

    if len(all_flashcards) < 4:
        return {"error": "Not enough flashcards for a quiz."}

    quiz_questions = []
    correct_cards = random.sample(all_flashcards, min(10, len(all_flashcards)))

    for correct in correct_cards:
        wrong_options = [fc.gloss for fc in all_flashcards if fc.gloss != correct.gloss]
        choices = random.sample(wrong_options, 3) if len(wrong_options) >= 3 else wrong_options
        choices.append(correct.gloss)
        random.shuffle(choices)

        quiz_questions.append({
            "video_url": correct.video_url,
            "options": choices,
            "correct_answer": correct.gloss
        })

    return quiz_questions


# ---------------------- Submit Quiz Result ----------------------
 # each dict = {"question": "hello", "selected": "thank you", "correct": true}

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

    # ---------------------- Update or Create Progress ----------------------
    progress = db.query(UserProgress).filter_by(user_id=current_user.id).first()
    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            total_quizzes=1,
            total_correct=correct_count,
            last_score=score,
            current_level=1
        )


    progress.total_quizzes = (progress.total_quizzes or 0) + 1
    progress.total_correct = (progress.total_correct or 0) + correct_count

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


# ---------------------- User Progress (DB-based) ----------------------
@router.get("/api/user/progress")
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.query(UserProgress).filter_by(user_id=current_user.id).first()

    if not progress:
        return {
            "user_id": current_user.id,
            "email": current_user.email,
            "message": "No progress found."
        }

    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "current_level": progress.current_level,
        "total_quizzes": progress.total_quizzes,
        "total_correct": progress.total_correct,
        "last_score": progress.last_score,
        "updated_at": progress.updated_at
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

# ---------------------- Get Incorrect Quiz Answers ----------------------
@router.get("/api/quiz/incorrect")
def get_incorrect_answers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

# ---------------------- Reset Learned Flashcards ----------------------
@router.post("/api/flashcards/reset")
def reset_learned_flashcards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(LearnedFlashcard).filter(LearnedFlashcard.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All learned flashcards reset for user."}