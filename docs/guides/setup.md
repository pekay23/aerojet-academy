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

Set the following environment variables for local development and E2E tests:

```bash
# Staff portal
E2E_STAFF_EMAIL="staff@aerojet-academy.com"
E2E_STAFF_PASSWORD="your-secure-password"

# Student portal
E2E_STUDENT_EMAIL="student@aerojet-academy.com"
E2E_STUDENT_PASSWORD="your-secure-password"

# Instructor portal
E2E_INSTRUCTOR_EMAIL="instructor@aerojet-academy.com"
E2E_INSTRUCTOR_PASSWORD="your-secure-password"

# Applicant portal
E2E_APPLICANT_EMAIL="applicant@example.com"
E2E_APPLICANT_PASSWORD="your-secure-password"

# Admin
E2E_ADMIN_EMAIL="admin@aerojet-academy.com"
E2E_ADMIN_PASSWORD="your-secure-password"
```

**Important**: Never commit real credentials. Use unique, strong passwords per environment. The seeded passwords are managed via the seed scripts using environment variables.
