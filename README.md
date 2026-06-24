# Cognate — Academic Intelligence Workspace

> **Submission:** Option B — Similar Question Finder with Auto-Tagging  
> **Assignment:** EduFlash EdTech Take-Home Challenge

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

---

## 🌐 Live Demo

**Hosted Application:** [https://cognate-beta.vercel.app](https://cognate-beta.vercel.app)

Experience the full semantic analysis platform in action. Sign up with your email, verify via OTP, and start submitting academic questions for intelligent duplicate detection and classification.

---

## 📋 Project Overview

**Cognate** is a full-stack semantic analysis platform built for academic curriculum management. It solves the core problem stated in **Option B**: detecting duplicate or semantically overlapping questions in academic databases while automatically classifying them by STEM subject area and Bloom's cognitive taxonomy level.

### What it does:

- ✅ Accepts natural language academic questions from authenticated users
- ✅ Embeds them using a dense bi-encoder model (BAAI/bge-small-en-v1.5)
- ✅ Classifies questions by STEM subject (Math, Physics, Biology, Computer Science) and Bloom's cognitive level (Recall, Apply, Evaluate)
- ✅ Searches the entire question corpus for semantically similar entries using cosine similarity
- ✅ Re-ranks candidates using a cross-encoder for high-precision duplicate detection
- ✅ Returns structured responses with similarity scores and classification metadata
- ✅ Persists questions with vector embeddings to MongoDB Atlas for future comparisons

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) | React Server-Side Rendering framework |
| **UI Design** | Vanilla CSS + Tailwind v4 | Neumorphic Design System with premium soft-UI aesthetic |
| **Backend** | FastAPI + Uvicorn | Async Python API server |
| **Database** | MongoDB Atlas (Motor async driver) | Question vectors + user data persistence |
| **Authentication** | JWT (HS256) | Stateless Bearer token-based session management |
| **ML - Stage 1** | BAAI/bge-small-en-v1.5 (Bi-Encoder) | Dense vector embeddings (~130MB) |
| **ML - Stage 2** | cross-encoder/ms-marco-MiniLM-L-6-v2 | High-precision reranking (~86MB) |
| **Email** | Gmail SMTP SSL (port 465) | Transactional OTP delivery |

### Language Composition

- **TypeScript:** 44.9%
- **Python:** 31.3%
- **JavaScript:** 19.3%
- **CSS:** 3.5%
- **Other:** 1.0%

---

## 🔐 Security & Authentication

### Password Security

**Algorithm:** Bcrypt with configurable salt rounds (default: 12)
