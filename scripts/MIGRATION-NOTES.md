# Exam Candidate Migration — Implementation Notes

## Overview

Bulk import utility for 8 existing exam-only candidates into the Aerojet Academy portal. Creates user accounts, wallets, exam history, free resit entitlements, and planned bookings.

## Schema Changes

### ExamBooking — New Fields
| Field | Type | Purpose |
|-------|------|---------|
| `bookingGroupRef` | String? | Groups twin/bundle bookings together (e.g., `EDITH-TWIN-1`) |
| `attemptType` | String? | `first_attempt` or `resit` |
| `result` | String? | `pass`, `fail`, or `pending` |
| `sourceNotes` | String? | Free-text notes from migration |
| `migrationRef` | String? | Idempotency key for migration deduplication |

### BookingEntitlement — New Model
Tracks free resit entitlements per twin/bundle booking. Key business rules:
- Each twin booking includes 1 free resit
- Free resits are **non-transferable** between booking groups
- Once used, any further resit must be separately paid

## Files Created

| File | Purpose |
|------|---------|
| `scripts/migrate-exam-candidates.ts` | CLI migration script (run with tsx) |
| `scripts/rollback-exam-candidates.ts` | Rollback script to undo migration |
| `scripts/templates/candidate-import-template.csv` | CSV template for future imports |
| `app/api/admin/migrate-candidates/route.ts` | Admin API endpoint (POST to import, GET to review) |

## How to Run

### Option 1: CLI Script (recommended for first migration)
```bash
npx dotenv-cli -e .env -- tsx scripts/migrate-exam-candidates.ts
```
Produces CSV reports in `migration-output/` directory.

### Option 2: Admin API
```bash
POST /api/admin/migrate-candidates
Authorization: (admin session required)
Content-Type: application/json

{
  "migrationRef": "EXAM_CANDIDATE_IMPORT_2026_03",
  "candidates": [ ... ]
}
```

### Deploy Schema Changes
```bash
npx prisma migrate dev --name add-booking-entitlements
# or for production:
npx prisma migrate deploy
```

## Idempotency

The migration is safe to re-run:
- **Users**: Looked up by personal email, academy email. Creates if missing, updates if found.
- **Wallet credits**: Uses `referenceType=migration` + `referenceId=MIGRATION_REF` to prevent double-credit.
- **Exam bookings**: Uses `migrationRef` field as unique key per booking. Skips if already exists.
- **Entitlements**: Uses `@@unique([userId, bookingGroupRef])` constraint. Skips if already exists.

## Rollback

```bash
npx dotenv-cli -e .env -- tsx scripts/rollback-exam-candidates.ts
```

This will:
1. Delete all exam bookings with the migration ref
2. Delete booking entitlements created by migration
3. Reverse wallet credits and delete migration transactions
4. Log which users were created (but does NOT delete them by default — uncomment code in script to delete)

## Currency Conversion Rule

```
EUR = CEILING((USD / 1.1659) / 10) * 10
```

Example: USD 780 -> 780 / 1.1659 = 668.97 -> ceil to nearest 10 = **EUR 670**

## Force Password Change

Already implemented in the existing codebase:
- `User.mustChangePassword` = `true` on import
- `User.passwordChanged` = `false`
- Student/Applicant layouts check this flag and show `ForcePasswordChange` component
- Change-password API endpoints set `mustChangePassword=false, passwordChanged=true`

## Student Mapping

| Student | Personal Email | Academy Email | Wallet EUR |
|---------|---------------|--------------|------------|
| David Archer | davarcher111@gmail.com | d.archer@aerojet-academy.com | 2,010 |
| Abdul Wahab Adam | adamwahab160@gmail.com | a.adam@aerojet-academy.com | 1,340 |
| Dzator Stanley Korku | stanleykdzator@gmail.com | d.korku@aerojet-academy.com | 670 |
| Fred Frimpong Ampeh | fredampeh@gmail.com | f.ampeh@aerojet-academy.com | 670 |
| Benard Bandor | benardbandor@gmail.com | b.bandor@aerojet-academy.com | 3,090 |
| Edith Afi Avege | puredzifa1@gmail.com | e.avege@aerojet-academy.com | 670 |
| Prince Wiafe | prince.wiafegh@gmail.com | p.wiafe@aerojet-academy.com | 0 |
| Ebenezer Oduro Kwarteng | odurokwarteng028@gmail.com | e.kwarteng@aerojet-academy.com | 0 |

## Edith Afi Avege — Special Cases

- **Twin 1 (EDITH-TWIN-1)**: M10+M8, both failed. Free resit used on M10 (failed again). Entitlement exhausted.
- **Twin 2 (EDITH-TWIN-2)**: M1+M9, both passed. Free resit unused but NOT transferable to M10.
- **Twin 3 (EDITH-TWIN-3)**: M2+M3 upcoming, paid. EUR 670 credited to wallet.
- Any future M10 resit must be separately paid.

## Security Notes

- Temporary passwords are 12 characters with upper, lower, digits, and special characters
- Passwords are hashed with bcrypt (12 rounds) before storage
- Credentials CSV is written to `migration-output/` — treat as sensitive, share with admin only
- Students must change password on first login before accessing any portal feature
