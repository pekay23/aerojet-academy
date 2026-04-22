# Contributing to Aerojet Academy

## 🌿 Branch Strategy
- `main` — Production-ready code.
- `staging` — Pre-production validation.
- `develop` — Integration branch for features.
- `feature/*` — Individual feature development.

## 🔄 Commit Messages & Versioning
We use **Conventional Commits** to automate versioning and changelogs.
- **feat**: A new feature (bumps minor version).
- **fix**: A bug fix (bumps patch version).
- **docs**: Documentation changes.
- **refactor**: Code change that neither fixes a bug nor adds a feature.
- **break**: A breaking change (bumps major version).

### Automation
The `pre-commit` hook automatically bumps the version and updates `docs/CHANGELOG.md`. 
To specify a bump type, use the `BUMP_TYPE` environment variable:
- **PowerShell**: `$env:BUMP_TYPE="minor"; git commit -m "..."`
- **Bash**: `BUMP_TYPE=minor git commit -m "..."`

## 🧪 Development Workflow
1. Branch from `develop`.
2. Sync your local database: `bun run db:push`.
3. Make changes and verify with `bun run type-check`.
4. Submit a PR to `develop`.

## 🗄️ Database Management
- **Primary**: Neon (Serverless PostgreSQL).
- **Backup/Redundant**: Supabase.
- **Migrations**: Always use `bun x prisma migrate dev` to generate migration files. Ensure both environments are synced if schema changes are made.

## 🎨 Coding Standards
- **Strict TypeScript**: No `any` types; all interfaces must be documented.
- **Branding**: Use `text-aerojet-blue` for primary UI elements.
- **Components**: Use Shadcn UI primitives where possible.
- **Accessibility**: All interactive elements must have unique `id` and descriptive labels.
