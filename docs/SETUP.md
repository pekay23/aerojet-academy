# Setup Guide

## Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL database (Neon recommended)

## Installation
```bash
git clone <repo-url>
cd aerojet-academy
npm install
```

## Environment Configuration
```bash
cp .env.example .env.local
# Edit .env.local with your database URL, API keys, etc.
```

## Database Setup
```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed with demo data
```

## Development
```bash
npm run dev            # Start dev server (http://localhost:3000)
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking
npm test               # Run tests
```

## Demo Credentials (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@aerojet-academy.com | REDACTED_PASSWORD |
| Staff | staff@aerojet-academy.com | REDACTED_PASSWORD |
| Instructor | instructor@aerojet-academy.com | REDACTED_PASSWORD |
| Student | student@aerojet-academy.com | REDACTED_PASSWORD |
| Applicant | applicant@example.com | REDACTED_PASSWORD |
