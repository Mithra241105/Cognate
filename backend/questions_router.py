"""
Cognate — Questions API Router.

Handles question submission and history retrieval. Each submitted question
is embedded, topic-classified, and cross-encoder re-ranked before a
duplicate check is performed. Non-duplicate questions are persisted to
MongoDB with their vector representation for future proximity comparisons.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Request

from classifier import classify_cognitive_level, classify_question_topic
from database import mongo_instance
from ml_engine import VectorEngine
from question_models import QuestionHistory, QuestionRequest, QuestionResponse, SimilarQuestion
from security import get_current_user
from vector_math import calculate_cosine_similarity


router = APIRouter()

# Minimum cosine similarity a question must share with at least one historical
# document to be considered a meaningful STEM query. Below this value the
# question is too dissimilar to the academic corpus to be worth persisting.
PROXIMITY_FLOOR = 0.15


@router.post("/questions", response_model=QuestionResponse)
async def submit_question(
    payload: QuestionRequest,
    request: Request,
    user_email: str = Depends(get_current_user)
):
    """
    Processes a submitted question through the full two-gate OOD pipeline.

    Pipeline stages:
      1. Embed the question text into a dense vector.
      2. Gate 1 — Classifier: Subject and cognitive classification via centroid
         proximity. Hard-aborts with a clean OOD response if the classifier
         rejects the question (junk anchor hit or score below 0.45 threshold).
         No database write occurs on Gate 1 rejection.
      3. Gate 2 — Proximity Floor: Computes cosine similarity against all stored
         vectors with the same topic tag. If the absolute best historical match
         is below PROXIMITY_FLOOR (0.15), the question is flagged OOD and
         refused persistence.
      4. Cross-encoder re-ranking of the top-10 proximity candidates.
      5. Duplicate detection: flags as duplicate if top re-ranked score > 0.98.
      6. Persists the question vector for in-domain, non-duplicate questions only.
    """
    vector_engine   = VectorEngine()
    question_vector = vector_engine.get_embedding(payload.question)

    subject_result     = classify_question_topic(question_vector, payload.question, request.app.state)
    assigned_tag       = subject_result["tag"]
    subject_confidence = subject_result["confidence"]

    cognitive_result     = classify_cognitive_level(question_vector, request.app.state)
    cognitive_tag        = cognitive_result["tag"]
    cognitive_confidence = cognitive_result["confidence"]

    db = mongo_instance.client.get_database("app_db")
    user_record = await db.users.find_one({"email": user_email})

    # --- STRATEGIC OOD GATE ENFORCEMENT ---
    is_allowed = (assigned_tag != "Out of Domain")
    
    # 3. Persist the detailed transactional record to MongoDB Atlas
    log_entry = {
        "user_id": user_record["_id"] if user_record else None,
        "email": user_email,
        "text": payload.question,
        "category": assigned_tag,
        "confidence_score": float(subject_confidence),
        "is_allowed": is_allowed,
        "timestamp": datetime.utcnow()
    }
    
    await db.history.insert_one(log_entry)

    # ── Gate 1: Classifier Rejection ─────────────────────────────────────────
    # Hard abort — no vector store access, no questions DB write (history is logged above).
    if not is_allowed:
        return QuestionResponse(
            original_question=payload.question,
            topic_tag="Out of Domain",
            subject_confidence=subject_confidence,
            cognitive_level=cognitive_tag,
            cognitive_confidence=cognitive_confidence,
            is_duplicate=False,
            similar_questions=[]
        )



    cursor               = db.questions.find({})
    historical_questions = await cursor.to_list(length=None)

    scored_questions = []
    for doc in historical_questions:
        doc_vector = doc.get("vector")
        if doc_vector:
            score = calculate_cosine_similarity(question_vector, doc_vector)
            scored_questions.append({
                "text":             doc["question"],
                "similarity_score": score,
                "topic_tag":        doc["topic_tag"]
            })

    scored_questions.sort(key=lambda x: x["similarity_score"], reverse=True)

    # ── Gate 2: Proximity Floor ───────────────────────────────────────────────
    # Even if the centroid classifier accepted it, a best-match cosine score
    # below PROXIMITY_FLOOR indicates the question is too semantically distant
    # from anything in the academic corpus to be a genuine STEM query.
    best_raw_score = scored_questions[0]["similarity_score"] if scored_questions else 0.0
    if best_raw_score < PROXIMITY_FLOOR:
        return QuestionResponse(
            original_question=payload.question,
            topic_tag="Out of Domain",
            subject_confidence=subject_confidence,
            cognitive_level=cognitive_tag,
            cognitive_confidence=cognitive_confidence,
            is_duplicate=False,
            similar_questions=[]
        )

    top_candidates = scored_questions[:10]
    reranked       = vector_engine.rerank_results(payload.question, top_candidates)

    similar_question_models = [SimilarQuestion(**match) for match in reranked]

    is_duplicate = bool(reranked and reranked[0]["similarity_score"] > 0.98)

    if not is_duplicate:
        new_doc = {
            "user_email":      user_email,
            "question":        payload.question,
            "topic_tag":       assigned_tag,
            "cognitive_level": cognitive_tag,
            "vector":          question_vector,
            "timestamp":       datetime.utcnow().isoformat()
        }
        await db.questions.insert_one(new_doc)

    return QuestionResponse(
        original_question=payload.question,
        topic_tag=assigned_tag,
        subject_confidence=subject_confidence,
        cognitive_level=cognitive_tag,
        cognitive_confidence=cognitive_confidence,
        is_duplicate=is_duplicate,
        similar_questions=similar_question_models
    )


@router.get("/history", response_model=List[QuestionHistory])
async def get_history(
    user_email: str = Depends(get_current_user),
    tag: Optional[str] = None
):
    """
    Returns the authenticated user's question history, optionally filtered by topic tag.

    Results are sorted by timestamp descending to surface the most recent queries first.
    """
    db    = mongo_instance.client.get_database("app_db")
    query = {"user_email": user_email}

    if tag:
        query["topic_tag"] = tag

    cursor    = db.questions.find(query).sort("timestamp", -1)
    documents = await cursor.to_list(length=None)

    return [
        QuestionHistory(
            id=str(doc["_id"]),
            user_email=doc["user_email"],
            question=doc["question"],
            topic_tag=doc["topic_tag"],
            timestamp=doc["timestamp"]
        )
        for doc in documents
    ]
