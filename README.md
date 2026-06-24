# Cognate — Academic Intelligence Workspace

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org)

## 🌐 Live Demo

**Hosted Application:** [https://cognate-six.vercel.app](https://cognate-six.vercel.app/)

---

## 📸 Application Showcase

> <img width="1918" height="967" alt="image" src="https://github.com/user-attachments/assets/d5c54a49-cb83-428f-bc2f-dceb571a52a7" />


> <img width="1918" height="677" alt="image" src="https://github.com/user-attachments/assets/8d3071fa-a30a-4fe0-b8dd-6bffd83f7b48" />


---

## 📋 Overview

Cognate is a full-stack semantic analysis platform for academic question management. It detects duplicate questions, classifies them by STEM subject (Math, Physics, Biology, CS) and Bloom's cognitive level (Recall, Apply, Evaluate), and persists embeddings to MongoDB for intelligent duplicate detection.

*This project was built to fulfill **Option B: Similar Question Finder with Auto-Tagging** for the EduFlash EdTech Hiring Assignment.*

### Features:
- Natural language question submission with secure JWT authentication
- Dense vector embeddings using BAAI/bge-small-en-v1.5 bi-encoder
- Two-stage duplicate detection: centroid classifier + cross-encoder reranking
- Native Bcrypt password hashing
- Real-time semantic similarity search across question corpus

---

## 🔑 Pre-Configured Test Accounts

For quick evaluation without signing up, you may use these pre-seeded test accounts on the live deployment:

- **Account 1:** `mithra112005@gmail.com` | **Password:** `1234`
- **Account 2:** `hsri59145@gmail.com` | **Password:** `123456`

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.10+, Uvicorn |
| Database | MongoDB Atlas, Motor async driver |
| Auth | JWT (HS256), Native Bcrypt |
| ML | Sentence-Transformers, Cross-Encoder |

---

## 🗄️ Database Schema

### Collections

**`users`** — User accounts with bcrypt hashed passwords
```javascript
{
  "_id": ObjectId,
  "id": "uuid",
  "email": "user@example.com",
  "password": "$2b$12$...[bcrypt_hash]...",
  "display_name": "User Name"
}
// Index: email (unique)
```

**`questions`** — Questions with dense vector embeddings (384-dim)
```javascript
{
  "_id": ObjectId,
  "user_email": "user@example.com",
  "question": "How does Dijkstra find shortest path?",
  "vector": [0.124, -0.856, ...],  // 384-dim float32 embedding
  "topic_tag": "Computer Science",
  "cognitive_level": "Apply",
  "created_at": ISODate,
  "is_duplicate": false
}
// Indexes: user_email + created_at, topic_tag
```

### Seed Data
The `backend/seed_database.py` script pre-populates MongoDB with 40 academic questions across 4 domains:

```python
STEM_QUESTIONS = [
  # Math (10 questions)
  'What is the fundamental theorem of calculus?',
  'How do you calculate the derivative of sin(x)?',
  'What is the Pythagorean theorem?',
  # ... more Math questions
  
  # Physics (10 questions)
  'What is the exact speed of light in a perfect vacuum?',
  'How does gravity warp the fabric of space-time?',
  'What is the definition of a photon?',
  # ... more Physics questions
  
  # Biology (10 questions)
  'What is a virus and how does it replicate?',
  'Explain the replication process of DNA during mitosis?',
  'What role does ATP play in cellular respiration?',
  # ... more Biology questions
  
  # Computer Science (10 questions)
  'What is the time complexity of a binary search algorithm?',
  'How does a hash map resolve memory collisions?',
  'Why is Dijkstra algorithm incapable of handling negative edge weights?',
  # ... more CS questions
]
```

**Run seeding:**
```bash
cd backend
python seed_database.py
```

---

## 🤖 AI Architecture

### Two-Stage Retrieval Pipeline

```plaintext
User Question
      ↓
┌─ GATE 1: Classifier ─────────────────┐
│ • Negative Lexical Anchors (22 junk  │
│   tokens: "weather", "recipe", etc.) │
│ • Centroid Cosine Similarity         │
│   (threshold: 0.45)                  │
│ • Disambiguation Matrix              │
└─────────────────────────────────────┬─┘
                ↓
┌─ GATE 2: Proximity Floor ────────────┐
│ • Min similarity threshold: 0.15     │
│ • Rejects OOD questions before DB    │
└─────────────────────────────────────┬─┘
                ↓
┌─ STAGE 1: Bi-Encoder Retrieval ─────┐
│ • BAAI/bge-small-en-v1.5 (384-dim)   │
│ • Cosine similarity search           │
│ • Top-10 candidates                  │
│ • O(n) complexity, <100ms on 10k docs│
└─────────────────────────────────────┬─┘
                ↓
┌─ STAGE 2: Cross-Encoder Reranking ──┐
│ • ms-marco-MiniLM-L-6-v2             │
│ • Pairwise attention [query, cand]   │
│ • Temperature softmax (T=0.7)        │
│ • Duplicate flag: score > 0.98       │
└─────────────────────────────────────┬─┘
                ↓
         JSON Response
     (topic, level, duplicates,
      similarity scores)
```

### Subject Classification
**3 Mechanisms:**

1. **Negative Anchors** — 22 junk tokens (weather, movie, crypto, etc.)
   - Cost: O(22) string comparisons
   - Returns OOD immediately if matched

2. **Centroid Cosine Similarity** — Pre-computed domain centroids
```plaintext
sim(q_vec, domain_centroid) = (q·c) / (|q||c|)
If max(sim) > 0.45 → assign domain, else OOD
```

3. **Disambiguation Matrix** — Rule-based score adjustments
```javascript
{
  "computer": { "boost": "CS", "penalize": "Bio", 
                "boost_factor": 1.3, "penalty": 0.4 }
}
```

### Cognitive Level (Bloom's Taxonomy)
```plaintext
RECALL   — "What is...", "Define...", definitions, facts
APPLY    — "How to...", "Calculate...", implement, solve
EVALUATE — "Analyze...", "Compare...", trade-offs, critique
```
Each level has a pre-computed centroid; highest scoring level wins.

---

## ⚡ Local Setup (Windows)

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas M0 cluster

### Step 1: Environment
Create `.env` in project root:
```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
SECRET_KEY=your_secret_key_min_32_chars
PRODUCTION_ORIGIN=http://localhost:3000

# Email Configuration (Required for Password Recovery)
MAILTRAP_HOST=live.smtp.mailtrap.io
MAILTRAP_PORT=587
MAILTRAP_USER=api
MAILTRAP_PASS=your_mailtrap_token
```

### Step 2: Launch
```bash
Double-click start.bat
```
Auto-opens:
- **Terminal 1:** FastAPI on `http://localhost:8000`
- **Terminal 2:** Next.js on `http://localhost:3000`

### Step 3: Open
Navigate to `http://localhost:3000`

---

## 🧪 Quick Test

### Signup
```bash
curl -X POST http://localhost:8000/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Password123"}'
```

### Login
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Password123"}'
```
Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

### Submit Question
```bash
curl -X POST http://localhost:8000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"question": "How does Dijkstra algorithm find shortest path?"}'
```
Response:
```json
{
  "original_question": "How does Dijkstra algorithm find shortest path?",
  "topic_tag": "Computer Science",
  "subject_confidence": 0.71,
  "cognitive_level": "Apply",
  "cognitive_confidence": 0.58,
  "is_duplicate": false,
  "similar_questions": []
}
```

### Duplicate Test (submit same question again)
```json
{
  "is_duplicate": true,
  "similar_questions": [
    {
      "text": "How does Dijkstra algorithm find shortest path?",
      "similarity_score": 0.9934,
      "topic_tag": "Computer Science"
    }
  ]
}
```

---

## 🔐 Security

| Method | Algorithm | Details |
|---|---|---|
| **Passwords** | Bcrypt | Native library, secure salting |
| **JWT** | HS256 | Expiry: 30 min, Bearer token |

---

## 📁 Project Structure

```plaintext
Cognate/
├── .env                    # Environment config
├── start.bat               # 1-click launcher
├── backend/
│   ├── main.py             # FastAPI entry point
│   ├── auth.py             # Login/Signup routes
│   ├── questions_router.py # Question submission
│   ├── classifier.py       # Subject/cognitive classification
│   ├── ml_engine.py        # VectorEngine singleton
│   ├── database.py         # MongoDB Motor connection
│   ├── security.py         # JWT + Bcrypt
│   ├── seed_database.py    # Seed 40 questions
│   ├── Dockerfile          # Deployment config
│   └── requirements.txt
└── frontend/
    ├── src/app/
    │   ├── layout.tsx      # Root layout
    │   ├── page.tsx        # Auth page
    │   └── globals.css     # Neumorphic design
    └── src/components/
        ├── Auth.tsx
        ├── Dashboard.tsx
        └── ShapeGrid.tsx
```

---

## 📦 Dependencies

**Backend:**
```plaintext
fastapi
uvicorn
motor[srv]
pymongo[srv]
python-dotenv
bcrypt
python-jose[cryptography]
certifi
sentence-transformers
```

**Frontend:**
```json
{
  "next": "^14.2.3",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "tailwindcss": "^3.4.1",
  "typescript": "^5"
}
```

---

## 📊 Performance

| Metric | Time |
|---|---|
| Question Embedding | ~50ms |
| Subject Classification | <1ms |
| Cognitive Classification | <1ms |
| Top-10 Retrieval | ~100ms |
| Cross-Encoder Reranking | ~50ms |
| End-to-End Pipeline | ~500ms |
| Cold-Start (model load) | 8-15s |

---

## 🚀 Deployment

**Frontend:** Auto-deployed to [Vercel](https://cognate-six.vercel.app/)

**Backend:** Docker-ready via `backend/Dockerfile`

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

**Cognate v1.0** — EduFlash EdTech Challenge Submission
