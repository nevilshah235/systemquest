# SystemQuest 🎮

> **Learn system design by doing.** SystemQuest is a gamified, full-stack educational platform that teaches system design through interactive missions. Build architectures, run simulations, and earn XP as you master real-world distributed systems concepts.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Docker (Recommended)](#run-with-docker-compose-recommended)
  - [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Scripts](#scripts)
- [Branches](#branches)
- [License](#license)

---

## Overview

SystemQuest presents developers with real-world system design scenarios — URL shorteners, file converters, scoreboards — and challenges them to build correct architectures using a drag-and-drop canvas. A simulation engine evaluates submissions, awards XP, and tracks progress across missions.

---

## Features

- 🗺️ **Mission-based learning** — Structured system design challenges with objectives, constraints, and scoring
- 🏗️ **Architecture Builder** — Drag-and-drop canvas to place and connect system components
- ⚙️ **Simulation Engine** — Evaluates submitted architectures against mission requirements
- 📊 **XP & Levelling** — Users gain experience points and level up as they complete missions
- 🏆 **Achievements** — Unlockable badges for milestones and exceptional submissions
- 🔐 **JWT Authentication** — Secure register/login with access + refresh token flow
- 📈 **Progress Tracking** — Per-user mission history, scores, and saved architectures
- 🤖 **AI Chat Assistant** — NVIDIA NIM-powered tutor with design-aware context
- 📋 **Living Rubrics** — AI-generated topology quality evaluation with per-item transparency

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **State** | Zustand |
| **Backend** | Node.js, Express, TypeScript |
| **ORM** | Prisma |
| **Database** | SQLite (file-based, via Prisma) |
| **Auth** | JWT (access + refresh tokens), bcryptjs |
| **AI** | NVIDIA NIM (`meta/llama-3.3-70b-instruct`) |
| **Security** | Helmet, CORS, express-rate-limit |
| **Logging** | Winston, Morgan |
| **Containerisation** | Docker, Docker Compose |

---

## Project Structure

```
systemquest/
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # User, Mission, MissionAttempt, Achievement, MissionRubric
│   └── src/
│       ├── index.ts
│       ├── routes/            # auth, missions, simulation, progress, chat, rubric
│       └── services/          # simulationEngine, chatService, rubricService, logger
└── frontend/
    └── src/
        ├── App.tsx
        ├── pages/             # LandingPage, AuthPage, DashboardPage, MissionPage, ProgressPage
        ├── components/
        │   ├── dashboard/     # Navbar, MissionCard
        │   └── mission/       # Builder, ChatAssistant, SimulationResults, SolutionViewer, RubricCard
        ├── data/              # types.ts, solutions.ts, api.ts
        └── stores/            # authStore, builderStore, chatStore
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- Docker and Docker Compose (for containerised setup)

### Run with Docker Compose (Recommended)

```bash
git clone https://github.com/nevilshah235/systemquest.git
cd systemquest
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |

### Local Development

#### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in values
npx prisma db push
npx prisma db seed
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

```env
# backend/.env
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secure-jwt-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
NVIDIA_API_KEY=your-nvidia-nim-api-key   # optional — enables AI chat + rubrics
```

---

## API Reference

Base URL: `http://localhost:4000/api`

| Route | Methods | Description |
|---|---|---|
| `/auth` | POST register/login/refresh/logout | Authentication |
| `/missions` | GET / GET :slug | Mission listing and detail |
| `/simulation/run` | POST | Run simulation on architecture |
| `/progress` | GET | User progress and history |
| `/chat/message` | POST | AI chat assistant |
| `/chat/simulation-analysis` | POST | AI simulation narrative |
| `/rubric/evaluate` | POST | Living rubric evaluation |
| `/rubric/:slug` | GET | Fetch approved rubric |

---

## License

MIT
