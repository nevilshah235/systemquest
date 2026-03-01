# 🎮 SystemQuest

> **Learn system design by building it.** Drag, connect, simulate, and level up through 50 real-world engineering challenges — from startup MVPs to FAANG-scale architectures.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)

---

## What is SystemQuest?

SystemQuest is an interactive, gamified platform for learning system design. You solve engineering scenarios — "handle 10,000 concurrent users", "design WhatsApp's messaging backend", "build Stripe's payment pipeline" — by dragging architecture components onto a canvas and connecting them. A simulation engine scores your design in real time across latency, throughput, availability, cost, and scalability.

No passive reading. No multiple-choice quizzes. You build the system, the system tells you if it works.

---

## ✨ Features

### 🏗️ Drag-and-Drop Architecture Builder
- **Visual canvas** for placing and wiring system components
- **Component palette** includes: Client, Server, Load Balancer, Cache (Redis), SQL Database, NoSQL Database, CDN, Message Queue, API Gateway, Auth Service, File Storage
- **Drag-from-edge handles** for creating connections with auto-generated labels
- **Inline label editing** directly on connection lines
- **Multiple instances** of the same component type (e.g., 3 App Servers behind a Load Balancer)
- **Component count display** in the palette so you know what's on the canvas
- **Visual grouping** — cluster servers behind load balancers to represent horizontal scaling
- **Save and load** architecture state per mission attempt

### ⚙️ Simulation Engine
- **Real-time evaluation** of your architecture as you build
- **Five scored metrics:**
  | Metric | What It Measures |
  |---|---|
  | Latency | Response time in milliseconds |
  | Throughput | Requests per second |
  | Availability | Uptime percentage |
  | Cost | Estimated monthly infrastructure cost |
  | Scalability | Maximum concurrent users supported |
- **Honest feedback** — no misleading "looks solid" messages when critical metrics are failing
- **Throughput gap display** — "You need 7,650 more concurrent users to hit the target"
- **3-tier hint system** — Hint 1 (directional) → Hint 2 (specific) → Full solution reveal
- **Educational tooltips** on every component explaining its role and trade-offs

### 🤖 AI Chat Assistant
- **NVIDIA NIM-powered** tutor (`meta/llama-3.3-70b-instruct`) with design-aware context
- Understands the current mission, your architecture canvas state, and simulation results
- Answers follow-up questions, explains concepts, and suggests next steps
- **AI simulation narrative** — converts raw metrics into natural language explanations

### 📋 Living Rubrics
- **AI-generated topology quality evaluation** with per-item transparency
- Rubric items are evaluated individually and surfaced with pass/fail reasoning
- Updated dynamically as you modify the canvas — not just at submission time

### 🗺️ 13 Missions Built Across 6 Learning Paths (50-Mission Roadmap)

| Path | Total Planned | Level | Built |
|---|---|---|---|
| 1. Foundations | 10 | Beginner | 3 ✅ |
| 2. Async & Queues | 8 | Beginner–Intermediate | 2 ✅ |
| 3. High-Read Systems | 8 | Intermediate | 2 ✅ |
| 4. Real-Time & Messaging | 8 | Intermediate | 2 ✅ |
| 5. Consistency & Transactions | 8 | Advanced | 2 ✅ |
| 6. Scale & Streaming | 8 | Advanced | 2 ✅ |
| **Total** | **50 planned** | | **13 built** |

**XP available in current build: 7,500 XP · Full 50-mission roadmap: 19,550 XP**

#### Currently Built Missions
| Slug | Mission | Path | Difficulty | XP |
|---|---|---|---|---|
| `mvp-launch` | MVP Launch | Foundations | ⭐ | 150 |
| `scaling-up` | Scaling Up | Foundations | ⭐⭐ | 300 |
| `global-expansion` | Global Expansion | Foundations | ⭐⭐⭐ | 500 |
| `file-converter` | File Converter | Async & Queues | ⭐⭐ | 400 |
| `code-judge` | Code Judge | Async & Queues | ⭐⭐⭐⭐ | 450 |
| `url-shortener` | URL Shortener | High-Read Systems | ⭐⭐⭐ | 500 |
| `search-engine` | Search Engine | High-Read Systems | ⭐⭐⭐⭐ | 650 |
| `live-scoreboard` | Live Scoreboard | Real-Time & Messaging | ⭐⭐⭐ | 600 |
| `ride-hailing` | Ride Hailing | Real-Time & Messaging | ⭐⭐⭐⭐⭐ | 700 |
| `booking-system` | Booking System | Consistency & Transactions | ⭐⭐⭐⭐ | 550 |
| `payment-processing` | Payment Processing | Consistency & Transactions | ⭐⭐⭐⭐⭐ | 800 |
| `social-feed` | Social Feed | Scale & Streaming | ⭐⭐⭐⭐⭐ | 900 |
| `video-streaming` | Video Streaming | Scale & Streaming | ⭐⭐⭐⭐⭐ | 1,000 |

#### FAANG Case Studies Covered
URL Shortener · Zamzar · Apache Kafka · Google Search · YouTube · Uber ETA · Twitter Timeline · Netflix · Stripe · CricBuzz · Codeforces · Airbnb · Bitly

#### 40 System Design Concepts Taught
APIs · API Gateways · JWTs · Webhooks · REST vs GraphQL · Load Balancing · Proxy vs Reverse Proxy · Scalability · Availability · SPOF · CAP Theorem · SQL vs NoSQL · ACID Transactions · Database Indexes · Database Sharding · Consistent Hashing · CDC · Caching · Caching Strategies · Cache Eviction Policies · CDN · Rate Limiting · Message Queues · Bloom Filters · Idempotency · Concurrency vs Parallelism · Long Polling vs WebSockets · Stateful vs Stateless · Batch vs Stream Processing · Geohashing · Service Mesh · Circuit Breaker · Saga Pattern · Event Sourcing · CQRS · Distributed Locks · Consensus Algorithms · Replication · Two-Phase Commit · Observability

### 🏆 XP & Progression System
- **XP rewards** scale with difficulty: 150 XP (beginner) → 1,000 XP (advanced)
- **Bonus XP** for optional challenge objectives (e.g., +25–50 XP per bonus component)
- **Level progression** tied to cumulative XP
- **Skill tree** unlocks as you advance through paths
- **Achievement badges** for milestones and special completions
- **Storyline unlocks** — start as a "startup-founder", unlock new narratives as you progress

### 🎯 Gamification Layer
- XP progress bar with visual level indicator
- Achievement badge collection (9 achievements including "System Design Master")
- Global leaderboard with rankings
- Mission unlock gates (complete prerequisites to advance)
- Per-mission bonus challenge objectives
- Visual skill tree showing mastery across all 6 paths

### 🔐 Authentication & User Management
- JWT authentication with refresh token rotation
- User registration and login
- Profile management
- Full progress persistence across sessions

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| Zustand | Lightweight state management |
| @dnd-kit/core | Accessible drag-and-drop |
| Cytoscape.js | Architecture graph visualization |
| Headless UI | Accessible component primitives |

### Backend
| Technology | Purpose |
|---|---|
| Node.js 20 + TypeScript | Runtime and language |
| Express.js | HTTP framework |
| Prisma ORM | Database access and migrations |
| SQLite (dev) / PostgreSQL (prod) | Data persistence |
| JWT | Authentication tokens |
| Zod | Runtime type validation |
| Helmet + CORS | Security headers |
| NVIDIA NIM (`meta/llama-3.3-70b-instruct`) | AI chat assistant + rubric evaluation |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerized local development |
| Nginx | Frontend reverse proxy |
| Vercel | Frontend deployment |
| Railway | Backend deployment |
| AWS S3 | User architecture file storage |
| Cloudflare CDN | Global asset delivery |
| Sentry | Error monitoring |
| Simple Analytics | Privacy-first usage analytics |
| GitHub Actions | CI/CD pipeline |

---

## 🏛️ System Architecture

The core architecture separates the React SPA (served via Vercel + Cloudflare) from the Express.js API (hosted on Railway), with Prisma managing all database access and AWS S3 handling architecture file storage.

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React SPA]
        DND[Drag-Drop Builder]
        VIZ[Architecture Visualizer]
        CHAT_UI[AI Chat Panel]
    end

    subgraph "API Gateway"
        GW[Express.js Gateway]
        AUTH[JWT Auth Middleware]
        RATE[Rate Limiter]
    end

    subgraph "Core Services"
        USER[User Service]
        MISSION[Mission Service]
        SIM[Simulation Engine]
        PROG[Progress Tracker]
        CHAT_SVC[Chat Service]
        RUBRIC_SVC[Rubric Service]
    end

    subgraph "AI Layer"
        NIM[NVIDIA NIM\nmeta/llama-3.3-70b-instruct]
    end

    subgraph "Data Layer"
        DB[(SQLite / PostgreSQL)]
        S3[(File Storage - S3)]
    end

    UI --> GW
    DND --> GW
    VIZ --> GW
    CHAT_UI --> GW
    GW --> AUTH
    AUTH --> RATE
    RATE --> USER
    RATE --> MISSION
    RATE --> SIM
    RATE --> PROG
    RATE --> CHAT_SVC
    RATE --> RUBRIC_SVC
    CHAT_SVC --> NIM
    RUBRIC_SVC --> NIM
    USER --> DB
    MISSION --> DB
    PROG --> DB
    SIM --> DB
    USER --> S3
```

---

## 🔍 High-Level Design (HLD)

The HLD shows the full production deployment topology — how traffic flows from a user's browser through Cloudflare's CDN, into the Vercel-hosted frontend, across to the Railway-hosted API, and down into the data layer. GitHub Actions drives all deployments; Sentry captures errors across both frontend and backend.

```mermaid
graph TB
    subgraph "Client"
        BROWSER[User Browser]
    end

    subgraph "CDN & Frontend"
        CF[Cloudflare CDN]
        VERCEL[Vercel\nReact SPA]
    end

    subgraph "Backend Services — Railway"
        API[Express.js API\nNode.js 20]
        SIM[Simulation Engine]
        EVAL[Evaluation Pipeline]
        PROG[Progress Tracker]
        CHAT_SVC[Chat Service]
    end

    subgraph "AI Layer"
        NIM[NVIDIA NIM API\nmeta/llama-3.3-70b-instruct]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL\nPrisma ORM)]
        S3[(AWS S3\nArchitecture Files)]
        REDIS[(Redis\nCache & Sessions)]
    end

    subgraph "DevOps"
        GHA[GitHub Actions\nCI/CD]
        SENTRY[Sentry\nError Monitoring]
        ANALYTICS[Simple Analytics]
    end

    BROWSER --> CF
    CF --> VERCEL
    VERCEL --> API
    API --> SIM
    API --> EVAL
    API --> PROG
    API --> CHAT_SVC
    CHAT_SVC --> NIM
    EVAL --> NIM
    SIM --> PG
    EVAL --> PG
    PROG --> PG
    API --> S3
    API --> REDIS
    GHA --> VERCEL
    GHA --> API
    SENTRY --> VERCEL
    SENTRY --> API
    VERCEL --> ANALYTICS
```

---

## 🔧 Low-Level Design (LLD)

The LLD details the internal component structure of the Simulation Engine and Evaluation Pipeline — the two most complex subsystems. The `ArchitectureParser` normalises the raw canvas JSON into a typed graph; each downstream module operates on that graph independently before the `FeedbackCompiler` assembles the final response.

```mermaid
graph TD
    subgraph "Input"
        CANVAS[Architecture JSON\nnodes + edges]
    end

    subgraph "Simulation Engine"
        PARSER[ArchitectureParser\nNormalise graph, extract components]
        METRICS[MetricsCalculator\nLatency · Throughput · Availability\nCost · Scalability]
        RUBRIC[RubricScorer\nCorrectness · Performance · Resilience\nCost Efficiency · Scalability]
    end

    subgraph "Evaluation Pipeline"
        AI[AIEvaluator via NVIDIA NIM\nAnti-pattern detection\nNatural language feedback]
        WTL[WhatToLearnEngine\nConcept card selection\nAdaptive filtering]
        MISTAKE[MistakeTracker\nPattern detection\nHeatmap update]
        LIVING[LivingRubricService\nPer-item AI evaluation\nReal-time updates]
    end

    subgraph "Output"
        COMPILER[FeedbackCompiler\nMerge metrics + rubric + AI + hints]
        RESPONSE[Structured Response\nscore · feedback · hints · concepts · rubric items]
    end

    CANVAS --> PARSER
    PARSER --> METRICS
    PARSER --> AI
    PARSER --> LIVING
    METRICS --> RUBRIC
    RUBRIC --> COMPILER
    AI --> COMPILER
    AI --> WTL
    RUBRIC --> MISTAKE
    LIVING --> COMPILER
    WTL --> COMPILER
    MISTAKE --> COMPILER
    COMPILER --> RESPONSE
```

### Metric Calculation Rules

| Metric | Base | Modifiers |
|---|---|---|
| Latency | 50ms | +20ms per DB hop · x0.7 with cache · +5ms per LB · -60% with CDN (static) |
| Throughput | 200 req/s per server | x server count behind LB · x cache hit multiplier |
| Availability | 99.5% (single server) | +0.4% with LB + 2 servers · +0.1% per DB replica |
| Scalability | 200 concurrent/server | +500 per additional server behind LB · x1.5 with cache · x2 with CDN (read-heavy) |
| Cost | $50/server/month | Additive per component type; CDN and S3 usage-based |

---

## 🔄 Design Flows

Key user journeys through the platform, from first login to mission completion.

### Flow 1 — Mission Attempt

```mermaid
flowchart TD
    A[Select Mission from Dashboard] --> B[Read Mission Briefing]
    B --> C[View What to Learn Concept Cards]
    C --> D[Build Architecture on Canvas]
    D --> E[Click Simulate]
    E --> F[Simulation Engine Runs]
    F --> G{Score >= Pass Threshold?}
    G -- Yes --> H[XP Awarded]
    H --> I[Mission Complete]
    I --> J[Progression Flow triggered]
    G -- No --> K[View Score + Rubric Breakdown]
    K --> L[Read AI Feedback]
    L --> M{Want a hint?}
    M -- Hint 1 --> N[Directional guidance shown]
    M -- Hint 2 --> O[Specific component suggestion]
    M -- Full Solution --> P[Solution architecture revealed]
    N --> D
    O --> D
    P --> D
```

### Flow 2 — Evaluation Pipeline

```mermaid
flowchart TD
    A[Architecture JSON submitted\nvia POST /simulate/architecture] --> B[ArchitectureParser\nNormalise nodes + edges]
    B --> C[MetricsCalculator\nCompute latency, throughput,\navailability, cost, scalability]
    C --> D[RubricScorer\nApply weighted dimensions\nReturn score 0-100]
    B --> E[AIEvaluator via NVIDIA NIM\nDetect anti-patterns\nGenerate natural language feedback]
    B --> L[LivingRubricService\nPer-item evaluation\nReal-time rubric updates]
    D --> F[MistakeTracker\nPersist attempt\nUpdate pattern history]
    E --> G[WhatToLearnEngine\nSelect concept cards\nFilter already-mastered concepts]
    D --> H[FeedbackCompiler]
    E --> H
    F --> H
    G --> H
    L --> H
    H --> I[Structured Response returned\nscore · rubric · feedback · hints · concepts]
```

### Flow 3 — Progression

```mermaid
flowchart TD
    A[Mission Passed] --> B[Calculate XP\nBase reward + bonus objectives]
    B --> C[Update total_xp in UserProgress]
    C --> D{Level threshold crossed?}
    D -- Yes --> E[Level Up\nNotify user]
    D -- No --> F[Check Achievements]
    E --> F
    F --> G{New achievement unlocked?}
    G -- Yes --> H[Award Badge\nShow notification]
    G -- No --> I[Check Storyline Unlocks]
    H --> I
    I --> J{Unlock criteria met?}
    J -- Yes --> K[Unlock new Learning Path]
    J -- No --> L[Unlock next Mission in path]
    K --> L
    L --> M[Update MistakeTracker patterns]
    M --> N[Refresh Dashboard]
```

### Flow 4 — Onboarding

```mermaid
flowchart TD
    A[User visits SystemQuest] --> B[Register account\nPOST /auth/register]
    B --> C[JWT issued\nSession started]
    C --> D[mvp-launch assigned\nMission 1: MVP Launch]
    D --> E[Intro concept cards shown\nAPIs · Load Balancing · SQL vs NoSQL]
    E --> F[User builds first architecture]
    F --> G[First simulation run]
    G --> H{Passed?}
    H -- Yes --> I[First XP earned\n150 XP]
    H -- No --> J[Guided hints shown\nEncouragement message]
    J --> F
    I --> K[Dashboard unlocked]
    K --> L[Learning path selection\nChoose your starting storyline]
    L --> M[scaling-up unlocked]
```

---

## 🧠 Evaluation System

SystemQuest evaluates every architecture submission across four layers: a deterministic rubric, simulation-derived metrics, an AI pattern analysis via NVIDIA NIM, and a longitudinal mistake tracker. Together they produce feedback that is specific, actionable, and personalised to each user's history.

### Rubric-Based Scoring

Each mission defines a `success_criteria` JSON object with five weighted dimensions. The final score is a weighted average across all dimensions, scored 0–100.

| Dimension | What It Checks | Typical Weight |
|---|---|---|
| Correctness | Required components present and correctly connected | 30% |
| Performance | Latency, throughput, and availability hit mission targets | 25% |
| Resilience | No single points of failure; redundancy where required | 20% |
| Cost Efficiency | Design stays within the mission's budget constraint | 15% |
| Scalability | Architecture can reach the target concurrent user count | 10% |

**Score thresholds:**

| Score | Grade | Outcome |
|---|---|---|
| 90–100 | Excellent | Full XP + bonus eligible |
| 75–89 | Good | Full XP awarded |
| 50–74 | Pass | XP awarded, improvement suggestions shown |
| < 50 | Fail | No XP; hints unlocked; retry encouraged |

**Example `success_criteria` JSON (scaling-up):**

```json
{
  "rubric": {
    "correctness": {
      "weight": 0.30,
      "criteria": ["load_balancer_present", "multiple_app_servers", "database_connected"]
    },
    "performance": {
      "weight": 0.25,
      "criteria": ["throughput_above_10000", "latency_under_150ms"]
    },
    "resilience": {
      "weight": 0.20,
      "criteria": ["no_spof", "min_two_app_servers_behind_lb"]
    },
    "cost_efficiency": {
      "weight": 0.15,
      "criteria": ["monthly_cost_under_2000"]
    },
    "scalability": {
      "weight": 0.10,
      "criteria": ["supports_10000_concurrent_users"]
    }
  }
}
```

---

### AI Evaluation Engine

After the rubric scorer runs, the AI Evaluator (powered by NVIDIA NIM) analyses the architecture graph for structural patterns and anti-patterns. It produces natural language feedback framed from the perspective of a senior engineer or FAANG interviewer.

**Anti-patterns detected:**

| Anti-Pattern | Example Feedback |
|---|---|
| Single Point of Failure | "Your load balancer routes all traffic to one database — this is a SPOF. Add a read replica." |
| Missing cache on read-heavy path | "You're hitting the database on every request. A cache layer here would cut latency by ~60%." |
| No rate limiting on public endpoint | "Your API Gateway has no rate limiter. A single bad actor could take down the service." |
| Synchronous-only chain | "Every step in your pipeline is synchronous. A message queue between the server and file processor would prevent timeouts on large uploads." |
| Over-engineered for budget | "You've added 4 app servers for a 1,000-user target. This exceeds the $500/month budget by 3x." |

**What the interviewer would say** — each piece of AI feedback includes a framing line that mirrors how a FAANG interviewer would raise the same concern, helping users build interview fluency alongside technical skill.

**Next concept suggestion** — the AI Evaluator maps each identified gap to one of the 40 system design concepts and surfaces it as a targeted learning recommendation: *"Based on this attempt, we recommend reviewing: Database Replication."*

---

### Living Rubrics

The Living Rubric system evaluates topology quality per rubric item in real time using NVIDIA NIM — not just at submission, but as you modify the canvas.

- Each rubric item is evaluated independently with pass/fail reasoning surfaced inline
- Rubric items update dynamically as components are added or connections are changed
- Results are persisted in the `MissionRubric` model and retrievable via `GET /rubric/:slug`

---

### What to Learn

Every mission surfaces curated concept cards before and after the attempt, adapted to what the user already knows.

**Pre-mission cards** (shown in the Mission Briefing):
- 3–5 concept cards covering the key ideas needed to solve the mission
- Each card includes: definition, real-world analogy, when to use it, and the most common mistake

**Post-mission cards** (shown after evaluation):
- Reinforces concepts the user got wrong
- Skips concepts the user demonstrated mastery of
- Links directly to the next mission where the concept appears again

**Example concept card — Load Balancing:**

| Field | Content |
|---|---|
| **Definition** | Distributes incoming traffic across multiple servers to prevent any single server from becoming a bottleneck |
| **Real-world analogy** | A supermarket with 10 checkout lanes — a greeter directs customers to the shortest queue |
| **When to use it** | Any time you have more than one server handling the same type of request |
| **Common mistake** | Adding a load balancer but only placing one server behind it — the LB adds latency with no throughput benefit |

**Adaptive filtering:** if a user scores 90+ on the Performance dimension across 3 consecutive missions, performance-related concept cards are suppressed and replaced with content targeting their current weakest dimension.

---

### Progress-Based Mistake Tracking

Every mission attempt is stored in full — architecture snapshot, rubric scores per dimension, AI feedback, and hint usage. The Mistake Tracker analyses this history to surface patterns the user may not notice themselves.

**Pattern detection examples:**

> "You've missed adding a cache layer in 4 of your last 6 missions."

> "Rate limiting on public endpoints has been absent in every attempt this week."

> "You consistently place the load balancer after the database rather than before the app servers."

**Mistake heatmap (Profile page):**
- Visual grid of all 40 system design concepts
- Colour-coded by failure frequency: green (strong) → yellow (occasional gap) → red (recurring weakness)
- Click any concept to see which missions triggered that failure and what the correct approach was

**Adaptive hint system:**
- If a user has failed the Resilience dimension 3+ times, Hint 1 for their next mission proactively mentions redundancy — before they ask
- Hint tier thresholds adjust per user: users with a strong track record get fewer unsolicited hints

**Weekly mistake digest:**
- Delivered on the Dashboard each Monday
- Shows top 3 recurring gaps from the past 7 days
- Recommends 1–2 specific missions to address each gap

**Streak tracking:**
- Tracks consecutive missions completed without triggering a specific mistake type
- Example: "5-mission streak: no SPOF in any submission"
- Streaks are displayed on the Profile page and contribute to achievement badges

---

## 📁 Project Structure

```
systemquest/
├── docker-compose.yml          # Orchestrates frontend + backend containers
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma       # User, Mission, MissionAttempt, Achievement, MissionRubric
│   │   └── migrations/
│   └── src/
│       ├── index.ts            # Express app entry point
│       ├── middleware/         # Auth, rate limiting, error handling
│       ├── prisma/             # Prisma client singleton + seed.ts (13 missions)
│       ├── routes/
│       │   ├── auth.ts         # Register, login, refresh, logout
│       │   ├── missions.ts     # Mission CRUD and attempt submission
│       │   ├── simulation.ts   # Architecture evaluation engine
│       │   ├── progress.ts     # XP, leaderboard, storyline unlocks
│       │   ├── chat.ts         # AI chat assistant endpoints
│       │   └── rubric.ts       # Living rubric evaluation endpoints
│       └── services/
│           ├── simulationEngine.ts
│           ├── chatService.ts   # NVIDIA NIM integration
│           ├── rubricService.ts # Living rubric AI evaluation
│           └── logger.ts
│
└── frontend/
    ├── Dockerfile
    ├── index.html
    ├── nginx.conf
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.ts
    └── src/
        ├── components/
        │   ├── dashboard/
        │   │   ├── Navbar.tsx
        │   │   └── MissionCard.tsx
        │   └── mission/
        │       ├── Builder.tsx             # Drag-drop canvas
        │       ├── ChatAssistant.tsx       # AI chat panel
        │       ├── SimulationResults.tsx   # Metrics display
        │       ├── SolutionViewer.tsx      # Solution architecture reveal
        │       └── RubricCard.tsx          # Living rubric display
        ├── pages/
        │   ├── LandingPage.tsx
        │   ├── AuthPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── MissionPage.tsx
        │   └── ProgressPage.tsx
        ├── data/
        │   ├── types.ts
        │   ├── solutions.ts
        │   └── api.ts
        └── stores/
            ├── authStore.ts
            ├── builderStore.ts
            └── chatStore.ts
```

---

## 🚀 Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- Or: Node.js 20+, npm 9+

---

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/nevilshah235/systemquest.git
cd systemquest

# Copy environment variables
cp .env.example .env

# Start both services
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |

To stop:
```bash
docker compose down
```

---

### Option 2: Manual Local Development

#### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev
```

Backend runs at `http://localhost:4000`

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL="file:./dev.db"          # SQLite for local dev
# DATABASE_URL="postgresql://..."     # PostgreSQL for production

# Authentication
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# AI (optional — enables AI chat assistant + living rubrics)
NVIDIA_API_KEY="your-nvidia-nim-api-key"

# Storage (production)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
AWS_REGION="us-east-1"

# Monitoring (production)
SENTRY_DSN=""
```

> ⚠️ **Never commit real secrets.** Rotate all secrets before deploying to production. The `NVIDIA_API_KEY` is optional for local development — AI features will be disabled if not set.

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create new account |
| POST | `/auth/login` | No | Login and receive tokens |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | Yes | Invalidate refresh token |

### Missions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/missions` | Yes | List all missions |
| GET | `/missions/:slug` | Yes | Get mission detail by slug |
| POST | `/missions/:id/attempt` | Yes | Submit architecture for evaluation |
| GET | `/missions/:id/attempts` | Yes | Get attempt history |

### Simulation

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/simulation/run` | Yes | Run simulation on architecture |
| POST | `/simulate/validate` | Yes | Validate against mission criteria |
| GET | `/simulate/results/:id` | Yes | Retrieve previous simulation result |

### Progress

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/progress` | Yes | User progress and history |
| POST | `/progress/complete-mission` | Yes | Mark mission complete, award XP |
| GET | `/progress/leaderboard` | Yes | Global XP rankings |

### AI Chat

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/chat/message` | Yes | Send message to AI tutor |
| POST | `/chat/simulation-analysis` | Yes | AI narrative on simulation results |

### Rubric

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/rubric/evaluate` | Yes | Evaluate architecture against living rubric |
| GET | `/rubric/:slug` | Yes | Fetch approved rubric for a mission |

---

## 🗄️ Database Schema

Managed by Prisma. Run `npx prisma studio` to browse data visually.

**User** — account credentials and identity
```
id, email (unique), username (unique), password_hash, created_at, updated_at
```

**UserProgress** — XP, level, and mission completion state
```
id, user_id → User, current_level, total_xp, unlocked_storylines[], completed_missions[]
```

**Mission** — scenario, requirements, and rewards (seeded — 13 missions)
```
slug (unique), title, difficulty (1-5), estimatedTime, xpReward, order
learningPath, skillLevel, description, scenario
objectives (JSON), requirements (JSON), components (JSON), feedbackData (JSON)
```

**MissionAttempt** — each architecture submission per user
```
id, user_id → User, mission_id → Mission, architecture (JSON), score, completed, feedback (JSON), attempt_number, created_at
```

**Achievement** — badge definitions (9 achievements)
```
slug, title, description, icon, xp_bonus
```

**MissionRubric** — AI-evaluated rubric results per mission
```
id, mission_slug, rubric_items (JSON), evaluated_at, approved
```

---

## 🔬 Simulation Engine

```typescript
interface ArchitectureMetrics {
  latency: number;      // Response time in ms
  throughput: number;   // Requests per second
  availability: number; // Uptime percentage (0-100)
  cost: number;         // Estimated monthly cost in USD
  scalability: number;  // Max concurrent users
}
```

| Metric | Base | Key Modifiers |
|---|---|---|
| Latency | 50ms | +20ms/DB hop · x0.7 with cache · -60% with CDN |
| Throughput | 200 req/s | x server count behind LB · x cache hit multiplier |
| Availability | 99.5% | +0.4% with LB+2 servers · +0.1% per DB replica |
| Scalability | 200 concurrent/server | +500/server behind LB · x1.5 cache · x2 CDN |
| Cost | $50/server/month | Additive per component; CDN/S3 usage-based |

---

## 📦 NPM Scripts

### Backend (`/backend`)

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `/dist` |
| `npm run start` | Run compiled production build |
| `npx prisma migrate dev` | Run pending migrations |
| `npx prisma studio` | Open Prisma visual DB browser |
| `npx prisma db seed` | Seed 13 missions + 9 achievements |
| `npx prisma generate` | Regenerate Prisma client |

### Frontend (`/frontend`)

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `/dist` |
| `npm run preview` | Preview production build locally |
| `npm run type-check` | Run TypeScript compiler check |

---

## 🌿 Branches

| Branch | Purpose |
|---|---|
| `main` | Stable production-ready code |
| `feature/systemquest-mvp` | Active MVP development |

---

## 🤝 Contributing

1. **Fork** the repository
2. **Branch** from `feature/systemquest-mvp`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** with clear, focused commits
4. **Test locally** using Docker Compose or manual setup
5. **Open a PR** targeting `feature/systemquest-mvp`

### Adding a New Mission

1. Add the mission definition to `backend/src/prisma/seed.ts`
2. Define `objectives`, `requirements`, `components`, and `feedbackData` as JSON matching the seed schema
3. Set the correct `learningPath`, `skillLevel`, `difficulty` (1–5), and `xpReward`
4. Run `npx prisma db seed` to load it locally
5. Update the built missions table in this README

---

## 📊 XP Summary

| Path | Missions Built | XP Available Now | Full Path XP (planned) |
|---|---|---|---|
| Foundations | 3 | 950 | ~3,500 |
| Async & Queues | 2 | 850 | ~2,800 |
| High-Read Systems | 2 | 1,150 | ~3,200 |
| Real-Time & Messaging | 2 | 1,300 | ~3,400 |
| Consistency & Transactions | 2 | 1,350 | ~4,000 |
| Scale & Streaming | 2 | 1,900 | ~4,200 |
| **Total** | **13** | **7,500** | **~21,100** |

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

---

*Built for engineers who learn by doing.*
