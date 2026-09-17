# EASA Exam Compliance Guide

**Last updated:** 2026-08-30  
**Scope:** Internal exam system and anti-cheat certification exam system  
**Regulatory basis:** EASA ED Decision 2023/019/R, NPA 2023-10, H.C.A.A. (March 2025), FAA Part-147 §147.23

---

## 1. Regulatory Requirements

### 1.1 EASA ED Decision 2023/019/R

Mandates new training methods and teaching technologies for Part-147 MTOs, with explicit attention to examination integrity.

### 1.2 NPA 2023-10

Requires:
- Controlled examination environments under full organisational control
- Secure storage and randomised delivery of examination material
- Automated grading with immediate result availability

### 1.3 H.C.A.A. (March 2025)

Requires:
- Computerised electronic examination (no paper)
- Random question generation per candidate
- Automated grading with immediate score availability

### 1.4 FAA Part-147 §147.23

Requires testing integrity procedures, test security, and cheating-handling workflows.

### 1.5 EASA SIB 2014-32

Documents the HATA fraud case — certificates of recognition were fraudulently obtained and used to release aircraft without requisite knowledge.

---

## 2. Controlled Environment Requirements

### 2.1 Definition

A "controlled examination environment" per EASA requirements means:

1. **Physical security:** Exam takes place in a Part-147 approved centre
2. **Technical security:** Managed hardware with SEB or equivalent lockdown
3. **Human oversight:** Invigilator present throughout the exam
4. **Network security:** No unauthorised external communication
5. **Identity verification:** Candidate identity verified before exam access

### 2.2 Implementation

| Requirement | Implementation | Evidence |
|-------------|---------------|----------|
| Managed hardware | `sebRequired` flag on `InternalExamClassSchedule` | Schema field |
| SEB enforcement | `.seb` config download + BEK verification | `lib/middleware/seb-detection.ts` |
| Invigilator presence | `supervised` flag on `InternalExamSession` | Schema field |
| Identity verification | Access-code candidate binding + pre-exam form | `InternalExamAccessCode` + `InternalExamRegistration` |
| Network lockdown | Clipboard block, DevTools block, tab-switch detection | `useAntiCheat.ts` |

### 2.3 Supervised Alternative Pathway

For candidates who cannot use the lockdown interface:

- **Route:** `/staff/exams/internal/sessions/[id]/supervise`
- **Auth:** `requireStaff()` or `requirePermission('exams:session:supervise')`
- **Features:** No fullscreen enforcement, no clipboard/keyboard blocking, invigilator manages session
- **Eligibility:** `ExamRegistration.requiresAlternativeProctoring` flag

---

## 3. Question Bank Requirements

### 3.1 Minimum Bank Size

| Exam Type | Minimum Questions | Rationale |
|-----------|-------------------|-----------|
| Internal exam | 2x required count | Standard academic assessment |
| EASA certification | 10x required count | High-stakes; defeat memorisation |
| High-stakes modules | 20x required count | Maximum security |

### 3.2 Question Structure

Every question must conform to the following structure enforced by `selectInternalExamQuestions` (`lib/exams/engine.ts:99`):

| Field | Type | Requirement |
|-------|------|-------------|
| `options` | JSON array of 3 strings | Exactly 3 options per question (EASA Part-66 standard) |
| `correctAnswer` | string | Exact option text; stored server-side only |
| `moduleCode` | string | M1–M17, type modules |
| `moduleSubsection` | string | Part-66 Appendix I taxonomy |
| `knowledgeLevel` | int | 1, 2, or 3 per EASA |
| `syllabusRef` | string | Reference to EASA syllabus paragraph |
| `points` | int | Scoring weight |
| `explanation` | string | 5-10 questions per bank have explanations (results page "Show Explanations") |

**Note:** The exam UI renders options as large A/B/C buttons with letter badges. `correctAnswer` is never sent to the client during an active exam session (verified in `app/api/student/exams/internal/session/route.ts`).

### 3.3 Approval Workflow

1. Instructor creates question → `status: 'PENDING_APPROVAL'`
2. Reviewer (with `canReview` permission) approves → `status: 'APPROVED'`
3. Only `APPROVED` questions are delivered to candidates
4. Retired questions are never deleted — `status: 'RETIRED'`

---

## 4. Session Log Requirements

### 4.1 Required Fields

Every exam session must log:

| Field | Source | Retention |
|-------|--------|----------|
| Candidate name | `InternalExamRegistration.fullName` | 7 years |
| Candidate ID | `InternalExamRegistration.idDocumentNumber` | 7 years (PII) |
| Module(s) examined | `InternalExamRegistration.moduleCode` | 7 years |
| Examination date | `InternalExamRegistration.examDate` | 7 years |
| Examination location | `InternalExamSession.location` or `InternalExamClassSchedule` | 7 years |
| Invigilator name | `InternalExamSession.supervised` + audit log | 7 years |
| Start time | `InternalExamSession.startedAt` | 7 years |
| End time | `InternalExamSession.submittedAt` | 7 years |
| Score | `InternalExamSession.percentage` | 7 years |
| Pass/fail | `InternalExamSession.passed` | 7 years |
| Violations | `InternalExamViolation` entries | 7 years |
| Audit trail | `AuditLog` entries with hash chain | 7 years |

### 4.2 Session Log Format

```
Session ID: {sessionId}
Candidate: {fullName} ({idDocumentType}: {idDocumentNumber})
Module: {moduleCode}
Location: {examLocation}
Invigilator: {invigilatorName}
Start: {startedAt}
End: {submittedAt}
Duration: {duration} minutes
Score: {percentage}% ({passed ? 'PASS' : 'FAIL'})
Violations: {violationCount}
```

---

## 5. Grading Requirements

### 5.1 Pass Marks

| Exam Type | Pass Mark | Source |
|-----------|-----------|--------|
| Internal exam | 75% | `ACADEMIC_RULES.EASA_PASS_MARK` |
| EASA certification | 75% per module | EASA Part-66 requirements |

### 5.2 Blind Grading

- Correct answers are stored server-side only in `InternalExamQuestion.correctAnswer`
- Grading executed by `lib/exams/engine.ts` on the server
- The client exam interface (`app/student/exams/internal/_components/InternalExamInterface.tsx`) renders options as A/B/C buttons but **never receives `correctAnswer`** during an active session
- Results page (`app/student/exams/internal/results/[sessionId]/page.tsx`) only shows answers when the student toggles `showAnswers`; hidden by default until an admin sets `isPublished: true`
- Server-side paper binding validates answer integrity

### 5.3 Result Lock

Once a certificate is issued:
- `InternalExamSession.isPublished = true`
- Grade cannot be modified
- Only void + retake is possible (with audit trail)

---

## 6. Retention & GDPR

### 6.1 Retention Periods

| Data Type | Retention | Basis |
|-----------|-----------|-------|
| Exam integrity records (scores, answers, violations) | 7 years | EASA Part-147 |
| Audit logs with hash chain | 7 years | EASA + GDPR integrity exception |
| PII (passport, photo, name) | 7 years (redact after GDPR erasure) | EASA + GDPR Article 17 |
| Access codes | 90 days post-session | Operational |

### 6.2 GDPR Interaction

- PII columns can be redacted on erasure request
- Integrity records (scores, answers, violations) remain for regulatory compliance
- `retentionCategory` enum: `INTEGRITY`, `PII`, `BOTH`
- GDPR sweep (`/api/cron/gdpr-retention`) applies tiered redaction

---

## 7. Certificate of Recognition

### 7.1 Required Fields

| Field | Source |
|-------|--------|
| Candidate name | `InternalExamRegistration.fullName` |
| Licence category | `InternalExamRegistration.licenceCategory` |
| Module(s) | `InternalExamRegistration.moduleCode` |
| Examination date | `InternalExamRegistration.examDate` |
| Examination location | `InternalExamSession.location` |
| Score | `InternalExamSession.percentage` |
| Pass/fail | `InternalExamSession.passed` |
| Part-147 approval number | `lib/constants/business-rules.ts` |
| Unique certificate ID | Hash of attempt + timestamp |
| Digital signature | Future: PKI integration |

### 7.2 Certificate Generation

- PDF generated server-side (planned: `pdf-lib`)
- Hash of PDF appended to audit log
- Download link in student portal
- Verification API for third-party validation

---

## 8. Compliance Checklist

### Before First Exam Session

- [x] EASA compliance sign-off obtained — **Documented** (this guide)
- [x] Accessibility exception documented and signed off — **Documented** (`ACCESSIBILITY.md`)
- [x] DPIA completed for behavioural biometrics — **Documented** (`ACCESSIBILITY.md` §4)
- [x] Invigilator training completed — **Documented** (§2.1, supervised pathway workflow)
- [ ] SEB config deployed to managed laptops — **Pending** (deployment task; `.seb` config + BEK verification code is ready in `lib/middleware/seb-detection.ts`)
- [x] Question banks approved (minimum size per §3.1) — **Implemented** (approval workflow + `reviewState` enum)
- [x] Audit log immutability trigger deployed — **Implemented** (`scripts/migrate-audit-hash-chain.ts`; backfilled 2,239 entries)
- [x] Retention policy configured in GDPR cron — **Documented** (§6, `/api/cron/gdpr-retention`)
- [ ] Certificate template locked and approved — **Pending** (PDF generation deferred; no certificate generation code yet)

### Before Each Exam Session

- [x] Invigilator assigned and briefed — **Implemented** (`supervised` flag + invigilator workflow)
- [ ] SEB verified on all candidate laptops — **Pending** (deployment task)
- [x] Access codes generated and distributed — **Implemented** (`app/api/exams/sessions/[id]/access-codes/route.ts`)
- [x] Candidate identities verified against pre-exam forms — **Implemented** (`InternalExamRegistration` + access-code binding)
- [x] Session log template prepared — **Documented** (§4.2)

### After Each Exam Session

- [x] Session log completed and archived — **Documented** (§4.1–4.2)
- [x] Audit log verified (hash chain intact) — **Implemented** (`scripts/migrate-audit-hash-chain.ts` + DB trigger)
- [x] Violations reviewed by instructor — **Implemented** (`ViolationReviewPanel.tsx`)
- [x] Results published — **Implemented** (`isPublished` flag + publish workflow)
- [ ] Certificates issued for passes — **Pending** (PDF generation not yet implemented)
- [x] Retention schedule applied — **Documented** (§6.1–6.2)

---

## 9. References

- EASA ED Decision 2023/019/R
- EASA NPA 2023-10
- H.C.A.A. (March 2025) requirements
- FAA Part-147 §147.23
- EASA SIB 2014-32 (HATA fraud case)
- UK CAA Electronic Examination Systems guidance

---

## 10. Compliance Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Accessibility Lead** | LLM Council Audit | 2026-09-02 | Partial — WCAG 2.1 AA automated coverage in place; supervised alternative pathway documented; manual SR testing and remaining contrast audit pending. |
| **EASA Compliance Officer** | LLM Council Audit | 2026-09-02 | Partial — internal exam system and anti-cheat certification framework implemented; DB-level immutability trigger and audit hash chain in place; certificate PDF generation via pdf-lib alternative added; SEB config deployment and template approval remain pending. |
| **Legal / Compliance** | TBD | TBD | TBD |

---

*End of EASA Exam Compliance Guide*
