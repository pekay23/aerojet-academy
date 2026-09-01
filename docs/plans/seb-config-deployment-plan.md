# SEB Config Deployment Plan

## Objective
Complete the Safe Exam Browser (SEB) integration so internal exams can be delivered in a fully locked-down environment with cryptographic request verification.

## Current State
- `lib/internal-exam/seb-config.ts` generates BEK pairs and `.seb` ZIP configs
- `app/api/staff/exams/internal/sessions/[id]/seb-config/route.ts` serves the `.seb` file
- `lib/middleware/seb-detection.ts` detects SEB requests
- `InternalExamSession` has `sebKeys` JSON field for BEK storage
- `InternalExamClassSchedule` has `sebRequired` boolean

## Gaps
1. No server-side enforcement that requests come from SEB
2. No admin UI to configure SEB settings per bank/class
3. No BEK rotation or expiry
4. SEB config lacks comprehensive lockdown defaults
5. No audit trail for SEB config downloads

## Implementation Steps

### Step 1: Add SEB request validation middleware
- Create `lib/middleware/seb-validation.ts`
- Validate `X-SafeExamBrowser-RequestHash` header against stored BEK
- Return 403 if hash mismatch or SEB required but not detected
- Apply to: `/api/student/exams/internal/start`, `/api/student/exams/internal/session`, `/api/student/exams/internal/access-code/validate`

### Step 2: Admin SEB settings UI
- Add SEB configuration section to `/staff/exams/internal/banks/[bankId]/schedule`
- Allow per-bank SEB settings: lockdown level, allowed apps, exit sequencer, print screen, clipboard
- Store settings in `InternalExamBank.sebConfig` JSON field (add to schema)

### Step 3: Enhanced SEB config generation
- Update `generateSebConfig()` to include bank-level settings
- Add `permissions`, `user_interface`, `exam_cookies` sections
- Include `browserExamKey` public key for hash verification

### Step 4: BEK lifecycle management
- Add `bekExpiresAt` to `InternalExamSession` for automatic rotation
- Cron job to rotate BEKs for active sessions
- Audit log for BEK generation and validation failures

### Step 5: Student SEB download UI
- Add "Download SEB Config" button to student exam dashboard
- Only visible when `sebRequired` is true for the class schedule
- Verify student eligibility before serving config

## Files to Modify
- `lib/middleware/seb-validation.ts` (new)
- `app/api/student/exams/internal/start/route.ts`
- `app/api/student/exams/internal/session/route.ts`
- `app/api/student/exams/internal/access-code/validate/route.ts`
- `prisma/schema.prisma` (add `sebConfig` to `InternalExamBank`)
- `app/staff/exams/internal/banks/[bankId]/schedule/_components/ClassSchedulePage.tsx`
- `app/student/exams/internal/_components/InternalExamDashboard.tsx`
- `lib/internal-exam/seb-config.ts`

## Acceptance Criteria
- Requests without valid SEB hash are rejected when SEB is required
- Admin can configure SEB settings per bank
- `.seb` files include comprehensive lockdown settings
- BEKs expire and rotate automatically
- All SEB config downloads are audit-logged
