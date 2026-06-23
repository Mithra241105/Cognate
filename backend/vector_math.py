"""
Cognate — Cosine Similarity Utility.

Provides a pure-Python implementation of cosine similarity for comparing
dense float vectors. Used by the classifier and question-matching pipeline
to avoid a NumPy dependency in the core math layer.
"""

import math


def calculate_cosine_similarity(vector_a: list[float], vector_b: list[float]) -> float:
    """
    Computes the cosine similarity between two equal-length float vectors.

    Raises ValueError for empty, mismatched, or zero-norm vectors to fail
    loudly at the call site rather than silently returning a garbage score.
    """
    if not vector_a or not vector_b:
        raise ValueError("Vectors must not be empty.")

    if len(vector_a) != len(vector_b):
        raise ValueError("Vectors must have the same dimensionality.")

    dot_product = sum(a * b for a, b in zip(vector_a, vector_b))
    norm_a      = math.sqrt(sum(a * a for a in vector_a))
    norm_b      = math.sqrt(sum(b * b for b in vector_b))

    if norm_a == 0.0 or norm_b == 0.0:
        raise ValueError("Vector norm cannot be zero.")

    return dot_product / (norm_a * norm_b)
