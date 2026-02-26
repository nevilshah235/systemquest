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

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Frontend Server** | Nginx |
| **Backend** | Node.js, Express, TypeScript |
| **ORM** | Prisma |
| **Database** | SQLite (file-based, via Prisma) |
| **Auth** | JWT (access + refresh tokens), bcryptjs |
| **Security** | Helmet, CORS, express-rate-limit |
| **Logging** | Winston, Morgan |
| **Containerisation** | Docker, Docker Compose |

---

## Project Structure

```
systemquest/
├── docker-compose.yml          # Orchestrates frontend + backend containers
├── .gitignore
│
├── backend/                    # Node.js + Express + Prisma API
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma       # DB models: User, Mission, MissionAttempt, Achievement
│   │   └── migrations/         # Prisma migration history
│   └── src/
│       ├── index.ts            # Express app entry point
│       ├── middleware/         # Auth guards, error handlers
│       ├── prisma/             # Prisma client + seed script
│       ├── routes/
│       │   ├── auth.ts         # Register, login, refresh, logout
│       │   ├── missions.ts     # Mission listing and detail
│       │   ├── progress.ts     # User progress and history
│       │   └── simulation.ts   # Architecture submission and evaluation
│       └── services/           # Business logic layer
│
└── frontend/                   # React + Vite SPA
    ├── Dockerfile
    ├── nginx.conf              # Nginx SPA routing config
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx            # React entry point
        ├── App.tsx             # Root component + routing
        ├── index.css           # Global styles + Tailwind directives
        ├── components/         # Reusable UI components
        ├── pages/
        │   ├── AuthPage.tsx    # Login / Register
        │   ├── DashboardPage.tsx  # Mission hub
        │   ├── MissionPage.tsx    # Architecture builder + simulation
        │   └── ProgressPage.tsx   # User stats and history
        ├── stores/             # State management (Zustand/Context)
        └── data/               # Static mission data / type definitions
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (for local development)
- [Docker](https://www.docker.com/) and Docker Compose (for containerised setup)

---

### Run with Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/nevilshah235/systemquest.git
cd systemquest

# Start both services
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |

---

### Local Development

#### 1. Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Run database migrations and seed
npm run prisma:migrate
npm run prisma:seed

# Start dev server (hot reload)
npm run dev
```

Backend runs at: `http://localhost:4000`

#### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173` (Vite default)

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=file:./dev.db

# JWT
JWT_SECRET=your-secure-jwt-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

> ⚠️ **Never commit real secrets.** The values above are for local development only. Rotate all secrets before deploying to production.

---

## API Reference

Base URL: `http://localhost:4000/api`

### Auth — `/api/auth`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/register` | Create a new user account | No |
| POST | `/login` | Login and receive tokens | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | Invalidate session | Yes |

### Missions — `/api/missions`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/` | List all missions | Yes |
| GET | `/:slug` | Get mission detail by slug | Yes |

### Progress — `/api/progress`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/` | Get current user's progress | Yes |
| GET | `/:missionId` | Get attempt history for a mission | Yes |

### Simulation — `/api/simulation`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/submit` | Submit architecture for evaluation | Yes |
| GET | `/results/:attemptId` | Retrieve simulation result | Yes |

---

## Database Schema

```
User
├── id, email, username, passwordHash
├── xp, level
└── → MissionAttempts, UserAchievements

Mission
├── id, slug, title, difficulty, xpReward
├── description, scenario, objectives (JSON)
├── requirements, components, feedbackData (JSON)
└── → MissionAttempts

MissionAttempt
├── id, score, xpEarned, completed
├── architecture (JSON), metrics (JSON)
└── → User, Mission

Achievement
├── id, slug, title, description, icon, xpBonus
└── → UserAchievements

UserAchievement
├── userId, achievementId, unlockedAt
└── → User, Achievement
```

---

## Scripts

### Backend

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript to dist/
npm run start            # Run compiled production build
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run pending migrations
npm run prisma:seed      # Seed the database with missions
npm run prisma:studio    # Open Prisma Studio (DB GUI)
```

### Frontend

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build locally
```

---

## Branches

| Branch | Purpose |
|---|---|
| `main` | Stable baseline |
| `feature/systemquest-mvp` | Active development — current MVP |
| `docs/readme-update` | Documentation updates |

---

## License

MIT
