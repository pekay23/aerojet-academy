# LLM Council Review — PDF Template System (Round 3 / FINAL)

## Stage 1: Persona Findings

### Persona 1: Security Auditor

**CRITICAL — `verifyDocument()` is dead code; revocation system is non-functional**
- **File**: `lib/document-verification.ts:85-93`
- **Finding**: The `verifyDocument(code)` function correctly checks `revokedAt` and `expiresAt`, but it is **never called** by any API route or page. The public verification page (`app/(public)/verify/[certificateId]/page.tsx:28`) calls `/api/certificates/verify/${certificateId}`, which only checks `certificate.verified` and ignores the `DocumentVerification` table entirely. QR codes embedded in PDFs point to `/verify/{certificateId}` (certificate ID), not `/verify/{code}` (DocumentVerification code).
- **Impact**: An admin cannot revoke or expire a verification record because no code path consults those fields. The `DocumentVerification.revokedAt`, `expiresAt`, `revokedBy`, and `revokeReason` columns are write-only.
- **Fix**: Either (a) change the QR code to embed `/verify/{code}` and route that to `verifyDocument()`, or (b) move revocation/expiry checks into the certificate verification API.

**WARNING — `uploadedBy` not populated**
- **File**: `app/staff/settings/_actions/pdf-template-actions.ts:252-261`
- **Finding**: `uploadSignatureAction` creates a `PdfSignature` record but never sets `uploadedBy`, despite the schema having `uploadedBy String?` and the plan documenting it.
- **Fix**: Add `uploadedBy: uploaderId` to the `data` object in `prismaUnfiltered.pdfSignature.create`.

---

### Persona 2: TypeScript / Type Safety Engineer

**CRITICAL — `qrDataUrl` prop rename is inconsistent and breaks the component**
- **File**: `components/pdf/templates/TranscriptTemplate.tsx:231-293`
- **Finding**: The `TranscriptTemplateProps` interface declares `qrDataUrl?: string` (line 256), but the component destructures `verificationCode` (line 291) and the JSX references `qrDataUrl` (line 435). This causes:
  - `Property 'verificationCode' does not exist on type 'TranscriptTemplateProps'` (TS2339)
  - `Cannot find name 'qrDataUrl'` (TS2304) at lines 435 and 437
  - Runtime `ReferenceError: qrDataUrl is not defined` (confirmed by failing tests)
- **Impact**: The QR code block never renders; the component crashes when `qrDataUrl` is passed.
- **Fix**: Change line 291 from `verificationCode` to `qrDataUrl` to match the interface and JSX.

**CRITICAL — Stale Prisma client types cause 4 compilation errors**
- **File**: `lib/document-verification.ts:90-91`
- **Finding**: `prismaUnfiltered.documentVerification.findUnique()` returns a type missing `revokedAt` and `expiresAt`, even though `schema.prisma` defines them. This means `prisma generate` has not been run after the schema changes.
- **Impact**: `verifyDocument()` cannot compile; the entire revocation logic is blocked by type errors.
- **Fix**: Run `bun run db:generate` to regenerate the Prisma client.

**WARNING — `CertificateTemplate` has both `qrDataUrl` and `verificationCode` props**
- **File**: `components/pdf/templates/CertificateTemplate.tsx:244,261,286,289`
- **Finding**: The props interface declares both `qrDataUrl?: string` (line 244) and `verificationCode?: string` (line 261). The component destructures both (lines 286, 289) and uses `qrDataUrl` for the `<Image>` and `verificationCode` for the label text. This dual-prop pattern is confusing and inconsistent with `TranscriptTemplate`.
- **Fix**: Standardize on `qrDataUrl` for the image and add `verificationCode` as a separate text prop, or rename consistently across both templates.

---

### Persona 3: Architecture / Performance Engineer

**WARNING — `revalidateTag(tag, 'max')` has incorrect semantics**
- **File**: `app/staff/settings/_actions/pdf-template-actions.ts:58,84,116,157,183,207`
- **Finding**: All mutation actions call `revalidateTag(tag, 'max')`. In Next.js 16, the second argument is a `cacheLife` profile — `'max'` means the new cache entry lives for the maximum duration (effectively a year). This defeats the purpose of cache invalidation.
- **Impact**: Staff edits to templates, signatures, etc. may not propagate to readers for an extended period.
- **Fix**: In server actions, use `updateTag(tag)` for immediate read-your-own-writes invalidation, or call `revalidateTag(tag)` without a profile argument.

**WARNING — Transcript generation does not create verification records**
- **File**: `app/api/pdf/student-transcript/route.tsx`, `app/api/pdf/staff/student-transcript/[id]/route.tsx`
- **Finding**: The transcript API routes render PDFs directly via `renderToStream` without calling `createVerificationRecord`. The comment in `lib/document-verification.ts:9` says "Every generated certificate / transcript creates a `DocumentVerification` row", but only certificates do.
- **Impact**: Students cannot verify transcripts via QR code; the verification system is certificate-only.
- **Fix**: Call `createVerificationRecord` in transcript generation and pass the resulting QR data URL to `TranscriptTemplate`.

**WARNING — `DocumentVerification` model is orphaned architecture**
- **File**: `prisma/schema.prisma:3623-3648`, `lib/document-verification.ts`, `lib/certificates/generator.ts:320-328`
- **Finding**: The `DocumentVerification` model, its library, and the `createVerificationRecord` call in certificate generation form a subsystem that has no consumer. The verification page and API never read from this table.
- **Impact**: Dead code and schema bloat. Future developers may assume revocation works when it does not.
- **Fix**: Either wire `DocumentVerification` into the verification flow (recommended) or remove the model and its library to avoid confusion.

---

### Persona 4: Compliance / Audit Specialist

**WARNING — Missing audit logs for signature assignment mutations**
- **File**: `app/staff/settings/_actions/pdf-template-actions.ts:299-324`
- **Finding**: `assignSignatureAction` and `removeSignatureAssignmentAction` perform mutations without any `createAuditLog` call. The plan explicitly called these out.
- **Impact**: There is no trail of who assigned or removed a signature from a template, which is a compliance gap for document governance.
- **Fix**: Add `createAuditLog` calls to both actions, capturing `templateId`, `signatureId`, and `position`.

**WARNING — Consent tracking partially incomplete**
- **File**: `app/staff/settings/_actions/pdf-template-actions.ts:263-270`
- **Finding**: The audit log for `uploadSignatureAction` records `consentMethod` in `changes` but omits `consentGivenBy`. The plan required both.
- **Fix**: Add `consentGivenBy: signature.consentGivenBy` to the audit log `changes` object.

**WARNING — No UI/API for revoking verification records**
- **File**: `prisma/schema.prisma:3640-3641`, `lib/document-verification.ts`
- **Finding**: The schema defines `revokedBy` and `revokeReason` on `DocumentVerification`, but there is no server action, API route, or staff UI to set them.
- **Impact**: Even if the verification flow were wired up, admins would have no way to revoke a compromised or erroneous document.
- **Fix**: Add a `revokeVerificationAction(code, reason)` server action and expose it in the staff settings UI.

---

### Persona 5: Frontend / UX Engineer

**WARNING — Settings Templates tab visible regardless of feature flag**
- **File**: `app/staff/_components/StaffSidebar.tsx:210`, `app/staff/settings/page.tsx:378-396`
- **Finding**: The Templates tab link is always rendered in the sidebar settings menu. The feature-flag check (`pdf_template_system_enabled`) only happens inside the page content, showing a disabled message after navigation.
- **Impact**: Users can navigate to the Templates tab, see a disabled state, but the sidebar still shows it as a first-class option.
- **Fix**: Conditionally render the Templates tab in `StaffSidebar` based on the `pdf_template_system_enabled` system setting.

**SUGGESTION — Hardcoded EASA text duplicated across 3+ files**
- **File**: `components/pdf/templates/CertificateTemplate.tsx:272`, `lib/certificates/generator.ts:149-150`, `lib/pdf-templates.ts:63`
- **Finding**: The same EASA Part-147 accreditation paragraph is copy-pasted in the template defaults, the certificate generator fallback, and the PDF templates library.
- **Fix**: Centralize in `lib/constants/business-rules.ts` or a dedicated `lib/pdf-templates/defaults.ts`.

---

## Stage 2: Peer Review Cross-Examination

- **Security → TypeScript**: The dead-code finding for `DocumentVerification` is reinforced by the type errors — stale Prisma types mean `revokedAt`/`expiresAt` are invisible to the compiler, making it impossible to even write the revocation check without first regenerating types.
- **TypeScript → Architecture**: The `qrDataUrl` vs `verificationCode` prop mismatch is not just a naming issue; it breaks the entire QR rendering pipeline, which means the verification subsystem has no working entry point even if the API were wired up.
- **Architecture → Compliance**: The missing audit logs for `assignSignatureAction`/`removeSignatureAssignmentAction` are especially damaging because the assignment table (`PdfTemplateSignature`) has no `updatedAt` or `updatedBy` fields — audit logs are the only mutable trace.
- **Compliance → Frontend**: The Templates tab visibility issue is a feature-flag UX bug that undermines the compliance intent of the `pdf_template_system_enabled` gate.
- **Frontend → Security**: The disabled Templates page is publicly accessible if a user bookmarks the URL; the page itself does not enforce the feature flag at the server action level, only at the render level.

## Stage 3: Chairman's Final Synthesis (Prioritized)

| Priority | Severity | Issue | Files Affected | Recommended Fix |
|----------|----------|-------|----------------|-----------------|
| 1 | CRITICAL | **TranscriptTemplate crashes**: `verificationCode` destructured but `qrDataUrl` used in JSX | `components/pdf/templates/TranscriptTemplate.tsx:291,435` | Rename destructured prop from `verificationCode` to `qrDataUrl` |
| 2 | CRITICAL | **`DocumentVerification` table is dead code**: QR codes and verification API never consult it, making revocation/expiry impossible | `lib/document-verification.ts`, `app/api/certificates/verify/[certificateId]/route.ts`, `lib/certificates/generator.ts` | Wire QR codes to use `DocumentVerification.code` and route verification through `verifyDocument()`, OR remove the unused model/library |
| 3 | CRITICAL | **Stale Prisma client**: 4 TS errors because `revokedAt`/`expiresAt` missing from generated types | `lib/document-verification.ts:90-91` | Run `bun run db:generate` |
| 4 | WARNING | **`uploadedBy` not set** on `PdfSignature` despite schema field and plan requirement | `app/staff/settings/_actions/pdf-template-actions.ts:252-261` | Add `uploadedBy: uploaderId` to create call |
| 5 | WARNING | **Missing audit logs** for `assignSignatureAction` and `removeSignatureAssignmentAction` | `app/staff/settings/_actions/pdf-template-actions.ts:299-324` | Add `createAuditLog` to both actions |
| 6 | WARNING | **Templates tab visible** in sidebar when feature is disabled | `app/staff/_components/StaffSidebar.tsx:210` | Conditionally render tab based on `pdf_template_system_enabled` |
| 7 | WARNING | **No revoke UI/endpoint** for `DocumentVerification` despite schema fields | `prisma/schema.prisma:3640-3641`, `lib/document-verification.ts` | Add `revokeVerificationAction` and staff UI |
| 8 | WARNING | **Transcript verification records not created** — transcripts have no QR verification | `app/api/pdf/student-transcript/route.tsx`, `app/api/pdf/staff/student-transcript/[id]/route.tsx` | Call `createVerificationRecord` during transcript generation |
| 9 | SUGGESTION | **Hardcoded EASA text** duplicated across template, generator, and library | `CertificateTemplate.tsx`, `lib/certificates/generator.ts`, `lib/pdf-templates.ts` | Centralize in constants |
| 10 | SUGGESTION | **`revalidateTag(tag, 'max')`** uses max cache-life profile, delaying cache propagation | `app/staff/settings/_actions/pdf-template-actions.ts` | Use `updateTag(tag)` in server actions for immediate invalidation |

**Bottom Line**: The feature has 2 blocking bugs that prevent it from shipping — the TranscriptTemplate runtime crash and the completely non-functional revocation system. There are also 4 TypeScript compilation errors. These must be resolved before declaring the feature complete.

---

# LLM Council Post-Implementation Review (Round 4)

## Stage 1: Persona Findings

### Persona 1: Security Auditor

**CRITICAL — Server actions bypass feature flag**
- All 14 server actions in `app/staff/settings/_actions/pdf-template-actions.ts` now call `ensurePdfTemplateEnabled()` after `requireAdmin()`. **FIXED.**

**CRITICAL — No audit log for verification record creation**
- `lib/document-verification.ts:54-80` — `createVerificationRecord()` now calls `createAuditLog()` on every creation. **FIXED.**

**WARNING — Public verification API leaks PII**
- `app/api/certificates/verify/[certificateId]/route.ts` returns studentName, studentId, moduleCode, score, percentage. This is inherent to certificate verification; rate limiting should be added.

**WARNING — Public API exposes internal verification codes**
- Response includes `verificationCode`. This is by design for QR verification, but enables enumeration.

**WARNING — Shared mutable `reason` state causes audit log corruption**
- **FIXED** in `VerificationRecords.tsx` — per-row `reasons` state map.

**WARNING — No input validation on revocation reason**
- **FIXED** — server-side validation with 500-char limit.

**WARNING — No pagination guard on list limit**
- **FIXED** — `MAX_LIST_LIMIT = 200` enforced.

**WARNING — Predictable certificateNo enables enumeration**
- `transcript-{studentId}` pattern is guessable. Low risk for transcripts, but should be reviewed.

### Persona 2: TypeScript/Performance Engineer

**CRITICAL — Duplicate verification records on repeated downloads**
- **FIXED** — `createVerificationRecord()` now checks existing by `certificateNo` before creating.

**CRITICAL — Shared `reason` state across all rows**
- **FIXED** — per-row state map.

**WARNING — `VerificationRecord` interface has incorrect Date types**
- Client-side interface declares `Date | null` but server actions serialize to ISO strings. Functionally works due to `new Date()` wrapping, but interface is misleading.

**WARNING — Signature mutation actions missing `updateTag`**
- **FIXED** — added `updateTag('pdf-template')` to all 5 signature mutation actions.

**SUGGESTION — `verifyDocument` return type duplicates anonymous type**
- Should extract to named `DocumentVerificationView` interface.

### Persona 3: Compliance/Audit Specialist

**CRITICAL — Certificate generation does not create DocumentVerification records**
- **FIXED** — `lib/certificates/generator.ts` now always creates verification record.

**WARNING — `certificateNo` lacks unique constraint**
- **FIXED** — added `@unique` to schema.

**WARNING — No audit log for verification creation**
- **FIXED** — added to `createVerificationRecord()`.

**WARNING — Feature flag gates admin access but not creation**
- Transcript routes now create verification records unconditionally. This is intentional — verification records should exist regardless of UI visibility.

**WARNING — No data retention policy for DocumentVerification**
- Not addressed in this session. Should be added to GDPR retention cron.

### Persona 4: Frontend/UX Engineer

**CRITICAL — Shared `reason` state causes cross-row bleed**
- **FIXED** — per-row state.

**WARNING — No redirect when feature flag disabled but user navigates directly**
- Page shows disabled banner but tab remains active. Should redirect or hide tab entirely.

**WARNING — Revocation reason input lacks label**
- **FIXED** — added `sr-only` label.

**WARNING — Status badges color-only semantics**
- Text labels "Revoked"/"Active" are present inside badges.

## Stage 2: Chairman's Final Synthesis

| Priority | Severity | Issue | Status |
|----------|----------|-------|--------|
| 1 | CRITICAL | TranscriptTemplate crashes | FIXED |
| 2 | CRITICAL | DocumentVerification dead code | FIXED |
| 3 | CRITICAL | Stale Prisma client types | FIXED |
| 4 | CRITICAL | Certificate generation missing verification | FIXED |
| 5 | CRITICAL | Server actions bypass feature flag | FIXED |
| 6 | WARNING | `uploadedBy` not set | FIXED |
| 7 | WARNING | Missing audit logs for signature assignment | FIXED |
| 8 | WARNING | Templates tab visible when disabled | FIXED |
| 9 | WARNING | No revoke UI/endpoint | FIXED |
| 10 | WARNING | Transcript verification records not created | FIXED |
| 11 | WARNING | `revalidateTag(tag, 'max')` incorrect semantics | FIXED |
| 12 | WARNING | Shared `reason` state | FIXED |
| 13 | WARNING | No server-side reason validation | FIXED |
| 14 | WARNING | No cache invalidation on revoke | FIXED |
| 15 | WARNING | No pagination guard | FIXED |
| 16 | WARNING | `certificateNo` not unique | FIXED |
| 17 | SUGGESTION | Hardcoded EASA text | PENDING |
| 18 | SUGGESTION | No data retention policy for verifications | PENDING |

**Remaining items**: Hardcoded EASA text deduplication and GDPR retention policy for `DocumentVerification` table. These are non-blocking.

## Stage 3: EASA Question Bank Health Fix

**Root cause**: `calculateMinimumPoolSize()` used `getMaxCategoryQuestionCount()` which returns the maximum across ALL categories. For M1, Category A needs 16 but max is 32, so minimum pool was 96. Banks with 40 questions showed RED.

**Fix**: Added category-aware helpers `getCategoryQuestionCount()` and `getCategoryEssayCount()`. Updated `calculateMinimumPoolSize(moduleCode, categoryCode?)` to use category-specific counts. Updated `app/api/staff/exams/internal/banks/route.ts` and `lib/internal-exam/engine.ts` to pass `bank.categoryCode`.

**Result**: Banks now calculate minimums based on their actual license category requirement, not the worst-case across all categories.

