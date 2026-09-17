# Setup Guide

## Prerequisites

- Node.js >= 24.0.0
- Bun >= 1.0.0 (package manager)
- PostgreSQL database (Neon recommended)

## Installation

```bash
git clone <repo-url>
cd aerojet-academy
bun install
```

## Environment Configuration

```bash
cp .env.example .env
# Edit .env with your database URL, API keys, etc.
```

## Database Setup

```bash
bun run db:generate    # Generate Prisma client
bun run db:push        # Push schema to database
bun run db:seed        # Seed with core system data
bun run db:seed:mock   # Seed with high-fidelity test data (Pathways, Exams, etc.)
```

## Development

```bash
bun dev                # Start dev server (http://localhost:3000)
bun run lint           # Run ESLint
bun run type-check     # TypeScript type checking
bun run test           # Run tests (Vitest)
```

## Demo Credentials (after seeding)

| Role        | Email                          | Password        |
| ----------- | ------------------------------ | --------------- |
| Super Admin | admin@aerojet-academy.com      | Admin@2026      |
| Staff       | staff@aerojet-academy.com      | Staff@2026      |
| Instructor  | instructor@aerojet-academy.com | Instructor@2026 |
| Student     | student@aerojet-academy.com    | Student@2026    |
| Applicant   | applicant@example.com          | Applicant@2026  |
