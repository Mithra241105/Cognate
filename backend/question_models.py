from typing import List
from pydantic import BaseModel

class QuestionRequest(BaseModel):
    question: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "question": "string"
            }
        }
    }

class SimilarQuestion(BaseModel):
    text: str
    similarity_score: float
    topic_tag: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "string",
                "similarity_score": 0.95,
                "topic_tag": "string"
            }
        }
    }

class QuestionResponse(BaseModel):
    original_question: str
    topic_tag: str
    subject_confidence: float
    cognitive_level: str
    cognitive_confidence: float
    is_duplicate: bool
    similar_questions: List[SimilarQuestion]

    model_config = {
        "json_schema_extra": {
            "example": {
                "original_question": "string",
                "topic_tag": "string",
                "cognitive_level": "string",
                "is_duplicate": False,
                "similar_questions": [
                    {
                        "text": "string",
                        "similarity_score": 0.95,
                        "topic_tag": "string"
                    }
                ]
            }
        }
    }

class QuestionHistory(BaseModel):
    id: str
    user_email: str
    question: str
    topic_tag: str
    timestamp: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "string",
                "user_email": "string",
                "question": "string",
                "topic_tag": "string",
                "timestamp": "string"
            }
        }
    }
