# SystemQuest

A full-stack web application built with a TypeScript-based backend and frontend, containerised with Docker.

## Tech Stack

### Frontend
- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Server**: Nginx

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **ORM**: Prisma

### Infrastructure
- **Containerisation**: Docker / Docker Compose

## Project Structure

```
systemquest/
├── frontend/        # React + Vite + Tailwind frontend
│   ├── src/
│   ├── Dockerfile
│   └── ...
├── backend/         # Node.js + TypeScript + Prisma backend
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   └── ...
├── docker-compose.yml
└── .gitignore
```

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose installed

### Run with Docker Compose

```bash
docker-compose up --build
```

This will start both the frontend and backend services.

### Local Development

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the `backend/` directory based on your Prisma and service configuration.

## License

MIT
