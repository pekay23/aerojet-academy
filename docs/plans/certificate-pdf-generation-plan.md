# Certificate Template & PDF Generation Plan

## Objective
Add a certificate generation system for completed internal exams and short courses, with an admin toggle to enable/disable the feature.

## Current State
- `InternalExamSession` has `isPublished`, `score`, `percentage`, `passed` fields
- No certificate model or generation logic exists
- No PDF generation library installed

## Requirements
1. **Admin toggle** — SystemSetting `certificates_enabled` (default: `false` for internal exams)
2. **Template system** — HTML template with variables: `{{studentName}}`, `{{courseName}}`, `{{moduleCode}}`, `{{score}}`, `{{percentage}}`, `{{date}}`, `{{certificateId}}`
3. **PDF generation** — Use `@react-pdf/renderer` or `puppeteer` for PDF output
4. **Storage** — Store generated PDFs in Supabase storage (`aerojet-documents` bucket, `certificates/` folder)
5. **Download** — Student can download from exam results page; staff can download from session detail
6. **Verification** — Unique certificate ID with QR code for external verification

## Implementation Steps

### Step 1: Install dependencies
```bash
bun add @react-pdf/renderer  # or puppeteer
```

### Step 2: Database schema
```prisma
model Certificate {
  id            String    @id @default(cuid())
  certificateId String    @unique  // e.g. "CERT-2026-0001"
  sessionId     String?
  studentId     String
  courseId      String?
  moduleCode    String?
  template      String    @default("internal_exam")
  score         Float?
  percentage    Float?
  issuedAt      DateTime  @default(now())
  issuedBy      String?
  pdfUrl        String?
  verified      Boolean   @default(false)
}
```

### Step 3: Certificate service
- `lib/certificates/generator.ts` — template rendering + PDF generation
- `lib/certificates/templates/` — HTML/React PDF templates
- `app/api/certificates/[id]/route.ts` — serve PDF
- `app/api/certificates/verify/[certificateId]/route.ts` — public verification

### Step 4: Admin settings
- Add `certificates_enabled` to SystemSetting
- Add certificate template editor to staff settings

### Step 5: Student/staff UI
- "Download Certificate" button on exam results
- Certificate verification page at `/verify/[certificateId]`

## Files to Create/Modify
- `prisma/schema.prisma` (add `Certificate` model)
- `lib/certificates/generator.ts` (new)
- `lib/certificates/templates/internal-exam.tsx` (new)
- `app/api/certificates/[id]/route.ts` (new)
- `app/api/certificates/verify/[certificateId]/route.ts` (new)
- `app/student/exams/internal/[sessionId]/page.tsx`
- `app/staff/exams/internal/sessions/[id]/page.tsx`
- `app/staff/settings/page.tsx`

## Acceptance Criteria
- Admin can enable/disable certificate generation
- PDF certificates are generated with correct data
- Certificates are stored and downloadable
- Verification page shows certificate details
- Feature is disabled by default for internal exams
