# NoHunger VMS

Cleaned monorepo for the NoHunger Volunteer Management System.

## Active Apps

- Backend API: Express + MongoDB in backend
- Frontend App: Next.js (App Router) in nohunger-frontend

## Quick Start

### 1. Backend

- Open terminal in backend
- Install dependencies: npm install
- Create .env with:

PORT=5000
MONGODB_URI=mongodb://localhost:27017/nohunger-vms
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development

- Start server: npm run dev

### 2. Frontend

- Open terminal in nohunger-frontend
- Install dependencies: npm install
- Start app: npm run dev

Frontend runs on port 4028 by default.

## Deployment

For production deployment, use the provided `docker-compose.yml` and the example env files:

- `backend/.env.example`
- `nohunger-frontend/.env.example`

Run:

```bash
docker-compose up -d --build
```

Then verify:

```bash
curl http://localhost:5000/health
curl http://localhost:3000
```

## Core Features

- Authentication and role-based access (admin and volunteer)
- Volunteer onboarding with required gender and Nigerian state
- Admin volunteer management and grouping insights
- Activity and event management
- Invitation and notification workflows
- Check-in/check-out based hour tracking
- Admin bulk messaging

## Notes

- Legacy CRA frontend and temporary smoke artifacts were removed during cleanup.
- Self-report hours flow was removed from both frontend and backend APIs.
