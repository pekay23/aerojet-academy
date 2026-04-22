# Developer Handover Documentation

This document provides a comprehensive guide for developers taking over the Aerojet Academy portal. It covers recent implementations, architectural decisions, and known challenges.

## 🚀 Quick Links
- [Database & RLS Detail](./DATABASE_DETAIL.md)
- [Architecture & Problem Solving](./ARCHITECTURE_STRATEGIES.md)
- [Known Issues & Pending Fixes](./KNOWN_ISSUES.md)
- [Future Roadmap](./future_plans.md)

---

## 🏗️ Technical Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL (**Neon** as Primary, **Supabase** as Redundant/Backup)
- **ORM**: Prisma
- **Styling**: Tailwind CSS + Shadcn UI
- **Auth**: NextAuth.js
- **File Storage**: UploadThing

---

## 💎 Recently Implemented Features

### 1. Staff Analytics Dashboard (`/staff/reports`)
- **Tabbed Analytics**: Overview, Enrollment, Revenue, Exam Pools, and Attendance.
- **Timeframe Filtering**: Supports granular periods (1h, 4h, 24h, 7d, 30d, custom).
- **Dynamic Charts**: Powered by Recharts with responsive container sizing.
- **Key Files**:
  - `app/staff/reports/page.tsx`
  - `lib/analytics/reports.ts`
  - `lib/analytics/metrics.ts`

---

## 🔒 Security & RLS Implementation

### Prisma + Database RLS
The application uses a primary database on Neon with Supabase as a redundant backup.
- **Strategy**: RLS is enforced at the database level. The app currently relies on Prisma's application-level authorization, but a migration to full database-level RLS is in progress.
- **AsyncLocalStorage**: Used in `lib/prisma/rls.ts` (if configured) to inject the `auth.uid()` into the database session, allowing RLS policies to recognize the application user.

---

## 🛠️ Maintenance & Common Tasks

### Versioning & Changelog Automation
The project uses **Husky** and a custom script (`scripts/bump-version.js`) to automate versioning.
- **Automatic Patch**: Every commit automatically bumps the patch version and adds a "Maintenance" entry to `docs/CHANGELOG.md`.
- **Manual Major/Minor Bump**: To perform a major or minor bump, use the `BUMP_TYPE` environment variable:
  ```bash
  $ BUMP_TYPE=minor git commit -m "feat: add new reporting module"
  $ BUMP_TYPE=major git commit -m "break: core database schema change"
  ```
- **Syncing**: The `pre-commit` hook ensures that `package.json` and `docs/CHANGELOG.md` are always in sync with the latest commit.

### Database Migrations
1. Modify `prisma/schema.prisma`.
2. Run `bun x prisma migrate dev --name <description>`.
3. **Important**: If you hit RLS issues during migrations, ensure the `shadow database` has the appropriate permissions or is temporarily disabled for the migration user.

### Adding New Reports
1. Add the query logic to `lib/analytics/reports.ts`.
2. Update `app/staff/reports/page.tsx` to include the new tab or metric card.
3. **Performance Tip**: Wrap sequential database calls in `Promise.all` to avoid blocking the main thread.

---

## 📍 Handover Contact
For high-level project vision, contact the Project Manager. For architectural questions, refer to the `docs/architecture` folder.
