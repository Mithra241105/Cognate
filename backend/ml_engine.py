"""
Cognate — ML Inference Engine.

Implements a process-level singleton VectorEngine that lazy-loads the
bi-encoder and cross-encoder models on the first inference request.
This prevents heavy model instantiation from blocking server boot,
which is critical for free-tier cold-start constraints.
"""

import math
from functools import lru_cache

from sentence_transformers import CrossEncoder, SentenceTransformer


class VectorEngine:
    """
    Process-level singleton wrapping the bi-encoder and cross-encoder models.

    Models are deferred until the first call to `get_embedding` or
    `rerank_results`, allowing the server to reach a healthy state before
    loading several hundred MB of weights into RAM.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorEngine, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, "is_loaded"):
            self.bi_encoder   = None
            self.cross_encoder = None
            self.is_loaded    = False
            self.config       = {
                "model_name":    "BAAI/bge-small-en-v1.5",
                "reranker_name": "cross-encoder/ms-marco-MiniLM-L-6-v2",
                "status":        "ready"
            }

    def _load_models(self):
        """Materializes both models into RAM. Called exactly once per process."""
        self.bi_encoder    = SentenceTransformer("BAAI/bge-small-en-v1.5")
        self.cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", max_length=512)
        self.is_loaded     = True
        print("[LAZY LOAD] ML Models loaded into RAM.")

    @staticmethod
    @lru_cache(maxsize=1000)
    def _cached_encode(text: str) -> list[float]:
        """LRU-cached encoding to avoid re-computing embeddings for repeated queries."""
        return VectorEngine._instance.bi_encoder.encode(text).tolist()

    def get_embedding(self, text: str) -> list[float]:
        """Returns the dense vector embedding for the supplied text string."""
        if not self.is_loaded:
            self._load_models()
        return self._cached_encode(text)

    def rerank_results(self, query: str, documents: list[dict]) -> list[dict]:
        """
        Re-ranks candidate documents using the cross-encoder with temperature-calibrated softmax.

        A temperature of 0.7 is applied to the raw logits before normalization
        to produce a calibrated probability distribution rather than peaked argmax scores.
        Returns the top 3 documents sorted by calibrated similarity score.
        """
        if not self.is_loaded:
            self._load_models()

        TEMPERATURE = 0.7

        pairs      = [[query, doc["text"]] for doc in documents]
        raw_logits = self.cross_encoder.predict(pairs)

        scaled     = [s / TEMPERATURE for s in raw_logits]
        max_scaled = max(scaled)
        exp_scaled = [math.exp(s - max_scaled) for s in scaled]
        total      = sum(exp_scaled)
        calibrated = [e / total for e in exp_scaled]

        for doc, score in zip(documents, calibrated):
            doc["similarity_score"] = float(score)

        documents.sort(key=lambda d: d["similarity_score"], reverse=True)
        return documents[:3]
