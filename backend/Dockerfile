FROM python:3.10-slim

# Force transformers to cache in a writable directory
ENV HF_HOME=/app/.cache
ENV TRANSFORMERS_CACHE=/app/.cache

# Create the cache directory and ensure the upcoming user owns it
RUN mkdir -p /app/.cache

# Create a non-root user (required by Hugging Face Spaces)
RUN useradd -m -u 1000 user && chown -R user:user /app

USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /home/user/app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY --chown=user . /home/user/app

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
