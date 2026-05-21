# Agentic AI Claim Management

Monorepo for the Agentic AI Claim Management platform.

## Structure

```
├── frontend/    Next.js 14 UI application
├── backend/     Express + Prisma + PostgreSQL API
└── README.md
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

```bash
cd backend
npm install
cp .env.example .env   # Edit with your DB credentials
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Default Admin

- Email: admin@nttdata.com
- Password: admin123
