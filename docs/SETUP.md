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
cp .env.example .env.local
# Edit .env.local with your database URL, API keys, etc.
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
bun test               # Run tests
```

## Demo Credentials (after seeding)

| Role        | Email                          | Password        |
| ----------- | ------------------------------ | --------------- |
| Super Admin | admin@aerojet-academy.com      | REDACTED_PASSWORD      |
| Staff       | staff@aerojet-academy.com      | REDACTED_PASSWORD      |
| Instructor  | instructor@aerojet-academy.com | REDACTED_PASSWORD |
| Student     | student@aerojet-academy.com    | REDACTED_PASSWORD    |
| Applicant   | applicant@example.com          | REDACTED_PASSWORD  |
