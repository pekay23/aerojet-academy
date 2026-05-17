# Feasibility: On-Premise Deployable Training Portal (Product)

## Context

**Goal:** Productize the Aerojet Academy portal into a resellable/subscribable training management system that organizations can:
1. Run on their **local on-premise network** with their own database
2. Optionally **sync to cloud** for remote/general access
3. Be white-labeled and configured per organization

This is a **separate project** — Aerojet Academy stays as-is; the product is forked and remodeled.

---

## Verdict: Highly Feasible

| Aspect | Feasibility | Notes |
|--------|------------|-------|
| On-premise deployment | **Easy** | `output: 'standalone'` already set; Docker-ready |
| Local PostgreSQL | **Easy** | Swap Neon connection string for local Postgres |
| White-labeling | **Medium** | Extract branding into config/theme system |
| Cloud sync | **Medium-Hard** | PostgreSQL logical replication or API sync |
| Multi-tenancy | **Medium** | Decide: single-tenant per install vs. multi-tenant SaaS |
| Subscription/licensing | **Medium** | Add license key validation layer |

---

## Architecture: On-Premise + Cloud Sync

```
┌─────────────────────────────────────────────────────┐
│  CUSTOMER'S LOCAL NETWORK                           │
│                                                     │
│  ┌──────────────┐    ┌──────────────────────────┐  │
│  │  Local       │    │  Portal App              │  │
│  │  PostgreSQL  │◄──►│  (Next.js standalone)    │  │
│  │  Database    │    │  Docker / Node.js        │  │
│  └──────────────┘    │  http://portal.local     │  │
│                      └────────────┬─────────────┘  │
│                                   │                 │
└───────────────────────────────────┼─────────────────┘
                                    │ sync (when online)
                                    ▼
                      ┌─────────────────────────────┐
                      │  CLOUD (Optional)           │
                      │  - Remote access            │
                      │  - Backups                  │
                      │  - Central admin panel      │
                      │  - License validation       │
                      └─────────────────────────────┘
```

---

## What Needs to Change (Fork Scope)

### 1. Remove Aerojet-Specific Dependencies
| Current | Replace With |
|---------|-------------|
| Neon PostgreSQL (cloud) | Local PostgreSQL (customer installs) |
| Supabase Auth (if any) | Self-hosted NextAuth (already using it) |
| Resend (email) | Configurable SMTP (Nodemailer) |
| Uploadthing (files) | Local file storage (`/uploads/`) or configurable S3 |
| Stripe (payments) | Optional / configurable payment gateway |
| Vercel deployment | Docker container / `node server.js` |
| reCAPTCHA | Optional / self-hosted rate limiting |

### 2. Configuration System
Create a `portal.config.ts` (or `.env`-driven) that controls:
```
PORTAL_NAME="Aviation Training Academy"
PORTAL_LOGO="/branding/logo.png"
PORTAL_DOMAIN="training.customer.com"
PORTAL_PRIMARY_COLOR="#003366"
PORTAL_SMTP_HOST="mail.customer.com"
PORTAL_STORAGE_PROVIDER="local"  # or "s3"
PORTAL_CLOUD_SYNC_ENABLED=true
PORTAL_CLOUD_SYNC_URL="https://sync.yourproduct.com"
PORTAL_LICENSE_KEY="lic_xxxx"
```

### 3. Database: Local PostgreSQL
- Ship a `docker-compose.yml` with PostgreSQL + the app
- Keep the SAME Prisma schema (PostgreSQL → PostgreSQL, no SQLite)
- RLS works identically on local Postgres
- Customer just runs `docker compose up`

### 4. Cloud Sync Strategy

**Option A: PostgreSQL Logical Replication (Recommended)**
- Built into PostgreSQL — no custom code needed
- Local DB publishes changes → Cloud DB subscribes
- Bi-directional with conflict resolution (via `pglogical` or Postgres 16+ bi-directional)
- Customer configures sync in admin panel

**Option B: Application-Level API Sync**
- Background job sends new/updated records to cloud API
- Cloud pushes changes back down
- More control over what syncs, but more code to write
- Better for selective sync (e.g., only sync grades/attendance, not financial data)

**Recommended: Start with Option A** for full database sync, add Option B later for selective/filtered sync.

### 5. Licensing / Subscription
- License key validation on app startup
- Phone-home check (when online): validate key with your license server
- Offline grace period (30 days without validation)
- Feature gates by license tier (e.g., Basic: 50 students, Pro: unlimited)
- Admin dashboard on YOUR side to manage customer licenses

### 6. Deployment Packaging

**For customers:**
```
training-portal/
├── docker-compose.yml      # PostgreSQL + App + Redis (optional)
├── .env.example            # Customer fills in their config
├── data/                   # Persistent volumes (DB, uploads)
├── branding/               # Customer's logo, colors
└── README.md               # Setup guide
```

Customer runs:
```bash
docker compose up -d
# → App at http://localhost:3000 (or their domain)
```

**Or for Windows servers without Docker:**
- Bundle as NSIS installer with embedded Node.js + PostgreSQL
- Installs as a Windows Service
- Tray icon with start/stop/open browser
- Auto-updates from your server

---

## Implementation Phases

### Phase 1: Fork & Decouple (2-3 weeks)
- Fork codebase into new repo
- Replace hardcoded Aerojet branding with config-driven values
- Replace Neon adapter with standard `pg` adapter (local Postgres)
- Replace Resend with Nodemailer (configurable SMTP)
- Replace Uploadthing with local file storage (`multer` or similar)
- Remove/make-optional: Stripe, reCAPTCHA, Supabase
- Create `docker-compose.yml` for local deployment
- Create setup wizard (first-run admin account creation)

### Phase 2: White-Label System (2 weeks)
- Theme configuration (colors, logo, name) via admin panel or config
- Email templates driven by branding config
- Configurable portal name, domain, support contact
- Custom login page branding

### Phase 3: Licensing (2 weeks)
- License key generation system (your admin panel)
- Key validation in the app (startup + periodic)
- Feature gates by tier
- Offline grace period
- Subscription expiry handling (read-only mode)

### Phase 4: Cloud Sync (3-4 weeks)
- PostgreSQL logical replication setup guide
- OR: API-based selective sync engine
- Sync status dashboard in admin panel
- Conflict resolution strategy (last-write-wins with timestamps)
- Remote access portal (cloud-hosted, reads from synced DB)

### Phase 5: Installer & Distribution (2 weeks)
- Docker-based deployment (primary)
- Optional: Windows installer (NSIS + embedded Node.js + PostgreSQL)
- Auto-update mechanism
- Health monitoring / status page
- Backup/restore tooling

### Phase 6: Product Polish (2 weeks)
- Setup documentation
- Customer onboarding guide
- Admin guide (managing users, courses, exams)
- API documentation (for integrations)
- Demo instance

**Total: ~13-15 weeks** for a production-ready product.

---

## Key Decisions to Make

1. **Single-tenant or multi-tenant?**
   - Single-tenant (recommended for on-premise): Each customer gets their own instance
   - Multi-tenant: One cloud instance serves multiple orgs (more complex, but SaaS-friendly)

2. **What syncs to cloud?**
   - Everything (full DB replication) — simpler but more bandwidth
   - Selective (only grades, attendance, announcements) — more control, less risk

3. **Pricing model?**
   - Per-student seat licensing
   - Flat monthly/annual subscription by tier
   - One-time purchase + maintenance fee

4. **Target customer tech level?**
   - Docker-literate IT teams → ship Docker Compose
   - Non-technical → ship Windows installer with GUI setup wizard

---

## What Stays the Same

These work identically on-premise with local PostgreSQL:
- Prisma ORM + schema
- Row-Level Security (RLS)
- NextAuth credentials/2FA/passkeys
- All staff/student/applicant portals
- Exam system, grading, attendance
- Messaging, notifications
- Academic calendar
- Dashboard analytics

---

## Summary

This is a **productization** effort, not an "offline app" challenge. The core app is already architected well for this:
- Standalone output mode ✓
- PostgreSQL (same local or cloud) ✓
- Self-contained auth (NextAuth, no external IdP required) ✓
- No hard dependency on Vercel runtime ✓

The main work is **decoupling external services** (Neon, Resend, Uploadthing, Stripe) and adding **configuration/licensing layers**. The database and app logic port directly.
