# Contributing

## Branch Strategy
- `main` — Production
- `staging` — Pre-production testing
- `develop` — Active development
- `feature/*` — Feature branches

## Workflow
1. Create branch from `develop`
2. Make changes, write tests
3. Run `npm run lint && npm run type-check && npm test`
4. Create PR to `develop`
5. Code review required before merge

## Coding Standards
- TypeScript strict mode
- Prettier for formatting
- ESLint for linting
- Follow existing patterns for API routes, components, etc.
