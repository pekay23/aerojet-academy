# Anti-Cheat Examination System — Architecture & Implementation Plan

## Goal
Build a secure online examination system for EASA Part-147 / Part-66 aviation training (aligned with Suntech Aviation-style workflows) that enforces exam integrity via browser-level lockdown, server-authoritative timing, randomized question delivery, access-code gating, pre-exam student detail capture, and automated certificate generation — all deployable as an intranet or public SaaS module inside the existing Aerojet Academy Next.js application.

---

## 1. Regulatory & Threat Landscape (Why This Exists)

### 1.1 Regulatory Drivers
- **EASA ED Decision 2023/019/R** mandates new training methods and teaching technologies for Part-147 MTOs, with explicit attention to examination integrity.
- **NPA 2023-10** (EASA) targets fraud reduction in Part-147 examinations, requiring:
  - Controlled examination environments under full organisational control.
  - Secure storage and randomised delivery of examination material.
  - Automated grading with immediate result availability.
- **H.C.A.A. (March 2025)** now requires:
  - Computerised electronic examination (no paper).
  - Random question generation per candidate.
  - Automated grading with immediate score availability.
- **FAA Part-147** (14 CFR §147.23) requires testing integrity procedures, test security, and cheating-handling workflows.
- **EASA SIB 2014-32** documented the HATA fraud case — certificates of recognition were fraudulently obtained and used to release aircraft without requisite knowledge.

### 1.2 Threat Model (from research)
| Threat | Severity | Mitigation in This Design |
|--------|----------|---------------------------|
| Pre-exam question leakage (memorisation / sharing) | Critical | Tight scheduling windows, randomised question banks, unique papers per candidate |
| Tab-switch / search-engine lookup | High | Browser fullscreen lock, tab-switch detection, auto-submit on threshold |
| Second device (phone under desk) | High | Webcam proctoring (AI + human review), suspicious-gaze detection |
| Screen recording / screenshot | High | Clipboard block, PrintScreen block, right-click block, SEB-style lockdown |
| Remote desktop / VM-based cheating | High | VM detection (RDTSC timing, thermal zone, SCSI ID), process blacklist kill |
| Proxy candidate (someone else sits the exam) | High | Access-code login + identity verification + optional webcam face match |
| Browser DevTools / inspect element | Medium | DevTools detection, keyboard shortcut block, SEB enforcement |
| Copy-paste of questions to AI tools | Medium | Copy-paste block, honeypot fields, invisible watermarking |
| Post-exam answer sharing | Medium | Option shuffle + question shuffle, large question bank (>5x required questions) |
| Timer manipulation (client-side clock change) | Medium | Server-authoritative timer via WebSocket/SSE, not client clock |
| Session hijacking / credential reuse | Medium | Single-device login, JWT with exam-session binding, IP/device fingerprint |

---

## 2. System Architecture

### 2.1 High-Level Layered Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  Next.js 16 App Router (existing Aerojet codebase)          │
│  - Exam portal pages (staff/instructor/student roles)        │
│  - Secure exam delivery client (React + Tailwind)            │
│  - Webcam + fullscreen + anti-cheat client SDK               │
├─────────────────────────────────────────────────────────────┤
│                     Delivery Gate                            │
│  - Access-code validation (one-time use, time-bound)         │
│  - Pre-exam student detail form                              │
│  - Exam session creation (server-side state machine)         │
│  - Question randomisation (server-side, never client)        │
├─────────────────────────────────────────────────────────────┤
│                     Integrity Layer                          │
│  - Fullscreen enforcement + tab-switch detection             │
│  - Clipboard / print-screen / DevTools block                 │
│  - Webcam snapshot/video capture (server-side storage)       │
│  - VM / process blacklist detection (client + server)        │
│  - Keystroke dynamics + mouse pattern analysis               │
│  - Violation event stream → audit log                        │
├─────────────────────────────────────────────────────────────┤
│                     Proctoring Gate                           │
│  - AI flagging pipeline (gaze, multi-face, off-screen)       │
│  - Human reviewer queue (flagged moments)                    │
│  - Real-time proctor dashboard (staff/instructor view)       │
├─────────────────────────────────────────────────────────────┤
│                     Scoring Gate                              │
│  - Server-side blind grading (correct answers never to client)│
│  - Auto-grade MCQs; route essays to instructor rubric        │
│  - Immediate result calculation + pass/fail logic            │
├─────────────────────────────────────────────────────────────┤
│                     Credential Gate                           │
│  - Certificate of Recognition (CoR) generation               │
│  - PDF with EASA-formatted fields (module, date, score)      │
│  - Digital signature / hash chain for tamper evidence        │
├─────────────────────────────────────────────────────────────┤
│                     Integrity Spine                           │
│  - Append-only audit log (cryptographic hash chain)          │
│  - Every event: login, fullscreen, violation, submit, grade  │
│  - Retention: 7–10 years per aviation regulation             │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                                │
│  - PostgreSQL (existing Neon via Prisma dual-client)         │
│  - Supabase Storage (exam recordings, snapshots)             │
│  - Question bank (versioned, approval workflow)              │
│  - Exam session, attempt, violation, certificate tables      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow (Happy Path)
1. **Administrator** creates an exam session: selects module(s), sets time window, generates access codes, assigns candidates.
2. **Student** opens exam portal → enters access code → pre-exam detail form captures: full name, email, licence category, module(s), examination date, photo ID.
3. System validates access code (one-time, time-windowed, candidate-bound) → creates `ExamAttempt` record.
4. **Delivery Gate** serves first question block. Server has already randomised question order and shuffled options. Correct answers are stored server-side only.
5. Client enters **forced fullscreen**. Anti-cheat SDK activates: tab-switch listener, clipboard block, keyboard shortcut block, webcam capture every 15s.
6. Student answers. Each answer auto-saves to server (save-as-you-go). Timer runs server-side via SSE push.
7. On submit (manual or auto-submit after N violations / timer expiry):
   - Client sends answer set.
   - **Scoring Gate** grades server-side via `SECURITY DEFINER` function.
   - Result stored, audit log updated.
8. If pass: **Credential Gate** generates signed Certificate of Recognition PDF (EASA Part-66 compliant fields).
9. All events appended to **Integrity Spine** audit log with hash chain.

---

## 3. Module Breakdown

### 3.1 Exam Configuration (Admin / Instructor)
- **Exam Builder**: author MCQs (and essay) with module/subsection taxonomy matching EASA Part-66 Appendix I.
- **Question Bank**: versioned, approval workflow, minimum 5x required questions per exam for high randomisation.
- **Exam Session**: schedule window, duration, access-code list, candidate allowlist, VM detection toggle, SEB requirement toggle, violation threshold (default: 3 strikes → auto-submit).
- **Access Code Management**: 32-char codes (excludes 0/O/1/I), one-time use, expiry, candidate-binding.

### 3.2 Pre-Exam Student Detail Form
Fields required for EASA Certificate of Recognition:
- Full legal name (as per passport / national ID)
- Date of birth
- Nationality / country of residence
- Email address
- Phone number
- EASA licence category applied for (B1.1, B1.2, B2, etc.)
- Module(s) to be examined (M1–M17, type modules)
- Examination date (auto-filled from session schedule)
- Examination location (Part-147 approved centre)
- Candidate photo (uploaded via UploadThing → Supabase Storage)
- ID document number & type (passport / national ID)
- Declaration of truthfulness (electronic signature / checkbox)
- Consent to proctoring (webcam, behavioural logging) — GDPR-compliant plain-language consent

Form validation: Zod schema server-side + client-side. Submission creates `ExamRegistration` record linked to `ExamAttempt`.

### 3.3 Exam Delivery Client (React)
- **Fullscreen Gate**: `requestFullscreen()` on mount; `fullscreenchange` listener logs exits; overlay blocks UI when not fullscreen.
- **Anti-Cheat SDK** (client-side, `lib/exam/proctoring.ts`):
  - `visibilitychange` → tab-switch counter
  - `keydown` → block Ctrl+C, Ctrl+V, Ctrl+P, PrintScreen, F12, Alt+Tab, Cmd+Tab
  - `paste` / `copy` / `cut` → clipboard block
  - `contextmenu` → right-click block
  - `beforeunload` → warn on accidental close
  - `devtools` detection → flag (periodic `debugger` timing trick + `window.outerWidth` check)
  - `BroadcastChannel` → multi-tab prevention
  - Clipboard scrubber (periodic `navigator.clipboard.readText()` if permission granted)
- **Question Renderer**: one question per page or scroll; per-page timer persisted in `sessionStorage` (24h cookie).
- **Answer Persistence**: auto-save to server every 2s or on selection change.
- **Webcam Capture**: `getUserMedia` → capture still every 15s → upload to Supabase Storage. Camera-off detection after 30s gap.
- **SEB Integration**: optional `.seb` config download; server verifies `X-SafeExamBrowser-RequestHash` against Browser Exam Key.

### 3.4 Server-Authoritative Timer
- Timer started on `ExamAttempt` creation, stored in DB.
- SSE endpoint pushes remaining time every 1s.
- Client cannot extend timer; if client disconnects, server auto-submits at deadline.
- Warning toast at 60s remaining.

### 3.5 Auto-Submit on Key Press (MCQ Mode)
- User requirement: "hitting any key on the keyboard auto submits the session."
- Implementation:
  - In exam mode, a hidden `<input>` is always focused.
  - `keydown` listener on document: if exam config `strictMode: true`, any key press (excluding navigation keys if configured) triggers `handleSubmit()`.
  - Debounce 100ms to prevent double-submit from key-hold.
  - Violation logged: `violationType: 'KEY_PRESS_SUBMIT'`.
  - Client shows confirmation toast: "Key press detected. Exam auto-submitted."

### 3.6 Server-Side Blind Grading
- Correct answers stored in `answer_keys` table (RLS: admin-only read).
- Grading executed in PostgreSQL `SECURITY DEFINER` function:
  ```sql
  CREATE OR REPLACE FUNCTION submit_attempt(p_attempt_id UUID)
  RETURNS TABLE(score INT, passed BOOLEAN) AS $$
  BEGIN
    -- validate attempt ownership, compute score, update attempt, log audit
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
- MCQ: 1 point per correct answer; pass mark per EASA (typically 72%–75% per module).
- Essay: routed to instructor rubric grading UI.

### 3.7 Certificate of Recognition (CoR) Generation
- PDF generated via `pdf-lib` or `react-pdf` on server.
- Fields:
  - Candidate name, licence category, module(s)
  - Examination date & location
  - Score & pass/fail status
  - Part-147 MTO name, approval number (e.g., SI.147.005)
  - Unique certificate ID (hash of attempt + timestamp)
  - Digital signature placeholder (future: PKI)
- Stored in Supabase Storage; download link in student portal.
- Hash of PDF appended to audit log.

### 3.8 Audit & Compliance Spine
- `audit_logs` table: `id, actor_id, target_id, action, description, changes JSONB, ip_address, user_agent, created_at`.
- Cryptographic hash chain: each entry stores `previous_hash`; `SELECT ... ORDER BY created_at` allows integrity verification.
- Immutable: no UPDATE/DELETE allowed; only INSERT.
- EASA-required retention: 7 years minimum.

---

## 4. Integration with Existing Aerojet Academy

### 4.1 Routes (Next.js App Router)
```
app/
  (staff)/
    exams/
      page.tsx                    # Admin dashboard: exam list, create button
      create/
        page.tsx                  # Exam builder
      [id]/
        page.tsx                  # Exam config / candidate management
        candidates/
          page.tsx                # Candidate list, access-code generation
  (student)/
    exams/
      page.tsx                    # Available exams list
      [code]/
        page.tsx                  # Access-code entry + pre-exam form
      attempt/
        [id]/
          page.tsx                # Secure exam delivery
          submit/
            page.tsx              # Result + certificate download
  api/
    exams/
      route.ts                    # CRUD for exam sessions
      [id]/access-codes/
        route.ts                  # Generate / validate access codes
      [id]/attempts/
        route.ts                  # Create attempt, submit, grade
    exams/proctoring/
      events/
        route.ts                  # Receive client-side violation events
      webcam/
        route.ts                  # Upload webcam snapshots
    exams/certificate/
      [attemptId]/
        route.ts                  # Generate and return signed PDF
    exams/audit/
      route.ts                    # Query audit log for exam session
```

### 4.2 Database Schema (Prisma)
```prisma
model Exam {
  id            String    @id @default(cuid())
  title         String
  moduleCode    String    // e.g. "M1", "M7"
  licenceCategory String  // e.g. "B1.1", "B2"
  durationMinutes Int
  passMark      Int       // percentage, e.g. 72
  config        Json      // fullscreen, sebRequired, violationThreshold, etc.
  status        String    // draft | active | archived
  createdById   String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  questions     ExamQuestion[]
  sessions      ExamSession[]
}

model ExamSession {
  id              String    @id @default(cuid())
  examId          String
  exam            Exam      @relation(fields: [examId], references: [id])
  startTime       DateTime
  endTime         DateTime
  location        String?   // Part-147 approved centre
  accessCodes     ExamAccessCode[]
  registrations   ExamRegistration[]
  attempts        ExamAttempt[]
  createdAt       DateTime  @default(now())
}

model ExamAccessCode {
  id          String    @id @default(cuid())
  sessionId   String
  session     ExamSession @relation(fields: [sessionId], references: [id])
  code        String    @unique
  candidateId String?   // bound to specific candidate
  used        Boolean   @default(false)
  usedAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
}

model ExamRegistration {
  id              String    @id @default(cuid())
  sessionId       String
  session         ExamSession @relation(fields: [sessionId], references: [id])
  userId          String
  fullName        String
  email           String
  dob             DateTime?
  nationality     String?
  licenceCategory String
  moduleCode      String
  examDate        DateTime
  examLocation    String
  idDocumentType  String?
  idDocumentNumber String?
  photoUrl        String?
  consentGiven    Boolean   @default(false)
  signatureData   String?   // base64 of drawn signature or checkbox IP
  submittedAt     DateTime  @default(now())
  attempt         ExamAttempt?
}

model ExamAttempt {
  id              String    @id @default(cuid())
  registrationId  String    @unique
  registration    ExamRegistration @relation(fields: [registrationId], references: [id])
  examId          String
  exam            Exam      @relation(fields: [examId], references: [id])
  startedAt       DateTime  @default(now())
  submittedAt     DateTime?
  score           Int?
  passed          Boolean?
  autoSubmitted   Boolean   @default(false)
  violationCount  Int       @default(0)
  certificateUrl  String?
  answers         ExamAnswer[]
  violations      ExamViolation[]
}

model ExamAnswer {
  id            String   @id @default(cuid())
  attemptId     String
  attempt       ExamAttempt @relation(fields: [attemptId], references: [id])
  questionId    String
  selectedOption String?  // MCQ: "A" | "B" | "C" | "D"
  textAnswer    String?  // Essay
  isCorrect     Boolean?  // populated at grading time
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([attemptId, questionId])
}

model ExamViolation {
  id          String   @id @default(cuid())
  attemptId   String
  attempt     ExamAttempt @relation(fields: [attemptId], references: [id])
  type        String   // FULLSCREEN_EXIT | TAB_SWITCH | KEY_PRESS_SUBMIT | CLIPBOARD | DEVTOOLS | VM_DETECTED | CAMERA_OFF
  severity    String   // warning | critical
  detail      String?
  timestamp   DateTime @default(now())
}

model ExamQuestion {
  id            String   @id @default(cuid())
  examId        String
  exam          Exam     @relation(fields: [examId], references: [id])
  questionText  String
  questionType  String   // mcq | essay | msq
  options       Json?    // ["A) ...", "B) ...", ...]
  correctAnswer String   // never sent to client
  explanation   String?
  moduleSubsection String?
  knowledgeLevel Int?    // 1 | 2 | 3 per EASA
  sortOrder     Int?
  createdAt     DateTime @default(now())
}
```

### 4.3 Reuse of Existing Aerojet Infrastructure
- **Prisma dual-client**: use `prismaUnfiltered` in exam admin routes; RLS client for student self-service.
- **UploadThing**: candidate photo upload in pre-exam form.
- **Supabase Storage**: webcam snapshots, certificate PDFs.
- **Email (Resend)**: send access codes, result notifications, certificate download links.
- **Auth helpers**: `requireStaff`, `requireInstructor`, `requireStudent` from `lib/auth/helpers.ts`.
- **Audit logger**: extend `lib/audit/logger.ts` with `ExamAction` enum.
- **Cached queries**: cache active exams, upcoming sessions.
- **Loading skeletons**: `TableSkeleton`, `DashboardSkeleton` for exam lists.

---

## 5. Security Controls by Layer (Defense in Depth)

### 5.1 Client-Side Controls
| Control | Implementation | Bypass Risk |
|---------|---------------|-------------|
| Fullscreen lock | Fullscreen API + `fullscreenchange` listener + overlay | Medium (user can Esc out; overlay warns) |
| Tab-switch detection | `visibilitychange` + `blur` events | Low (cannot spoof from within browser) |
| Clipboard block | `copy`/`cut`/`paste` event `preventDefault()` | Medium (clipboard API, DevTools) |
| DevTools detection | `debugger` timing + `window.outerWidth - innerWidth` | Low-Medium |
| PrintScreen block | `keydown` on PrintScreen key | Low (OS-level screenshots bypass) |
| Keyboard shortcut block | `keydown` for Ctrl+C/V/P, Alt+Tab, F12 | Medium (accessibility tools) |
| Multi-tab prevention | `BroadcastChannel` + `localStorage` heartbeat | Low |
| Webcam capture | `getUserMedia` → snapshot every 15s | Medium (user can cover camera) |
| SEB enforcement | `.seb` config + `X-SafeExamBrowser-RequestHash` | Low (requires SEB install) |

### 5.2 Server-Side Controls
| Control | Implementation | Bypass Risk |
|---------|---------------|-------------|
| Server-authoritative timer | SSE push + DB `submittedAt` vs `startedAt` diff | Very Low |
| Blind grading | `SECURITY DEFINER` function; correct answers never to client | Very Low |
| Access-code validation | One-time use, time-windowed, candidate-bound in DB | Very Low |
| Single-device login | `deviceFingerprint` stored on attempt creation | Low |
| VM detection (server-side) | Client sends `navigator.hardwareConcurrency`, `WebGL` renderer, `screen` dimensions; anomaly scoring | Medium |
| Audit log hash chain | Append-only with `previous_hash` | Very Low |
| RLS on exam data | Prisma RLS for student self-service; `prismaUnfiltered` for admin | Very Low |

### 5.3 Physical / Process Controls
- Exam sessions scheduled in tight windows (e.g., 2 hours) to limit question-sharing.
- Proctor / invigilator required for on-site sessions (physical separation per 147.A.100(b)2).
- Post-exam statistical analysis: identical wrong-answer patterns, completion-time outliers, IP clustering.

---

## 6. UI/UX Flow

### 6.1 Student Journey
1. **Landing**: `/exams` → list of available exam sessions.
2. **Access Code Entry**: `/exams/[code]` → validate code → redirect to pre-exam form.
3. **Pre-Exam Form**: capture personal details, photo, consent. One-time per session.
4. **Exam Gate**: dark overlay listing active controls. "Enter Fullscreen to Begin."
5. **Exam Interface**: question by question, timer at top, webcam thumbnail (bottom-right), violation counter (bottom-left). Navigation panel on right.
6. **Auto-Submit**: on threshold breach → red overlay → exam locked → redirect to results.
7. **Results**: score, pass/fail, violation summary, certificate download (if passed).

### 6.2 Admin / Instructor Journey
1. **Dashboard**: `/staff/exams` → active sessions, pass rates, flagged attempts.
2. **Exam Builder**: wizard for module selection, question import (bulk CSV), randomised paper config.
3. **Candidate Management**: generate access codes, bulk upload candidate list, seat assignment.
4. **Proctor Review**: flagged moments (webcam snapshots + timeline), accept/dismiss workflow.
5. **Certificate Management**: view issued CoRs, reprint, verify authenticity (hash lookup).

---

## 7. Technology Choices & Rationale

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Next.js 16 (existing) | Zero new infra; SSR for SEO; API routes for backend logic |
| Database | PostgreSQL (Neon) + Prisma | Existing dual-client pattern; RLS; `SECURITY DEFINER` functions |
| Storage | Supabase Storage | Existing; webcam snapshots, certificates |
| Auth | NextAuth.js (existing) | JWT sessions; role guards already wired |
| Client State | Zustand | Lightweight; already used in mock-test reference |
| PDF Generation | `pdf-lib` (server) | No client-side deps; signed PDFs |
| Anti-Cheat SDK | Custom (`lib/exam/proctoring.ts`) | Full control; SEB-compatible headers; no vendor lock-in |
| Proctoring AI | Future: TensorFlow.js (client-side) or server-side worker pool | BlockProctor / VigilantEx reference architecture |
| WebSocket / SSE | Native `EventSource` | Low overhead; server-authoritative timer |
| Audit Log | Custom table + hash chain | No third-party dependency; EASA retention compliant |

---

## 8. Implementation Phases

### Phase 1: Core Exam Delivery (Weeks 1–4)
- [ ] Database schema migration (Exam, ExamSession, ExamQuestion, ExamAttempt, ExamAnswer, ExamViolation, ExamAccessCode, ExamRegistration).
- [ ] Admin exam builder (CRUD exams, import questions, configure sessions).
- [ ] Access-code generation and validation API.
- [ ] Pre-exam student detail form with UploadThing photo capture.
- [ ] Secure exam delivery client: fullscreen, question renderer, answer auto-save.
- [ ] Server-authoritative timer + auto-submit on expiry.

### Phase 2: Anti-Cheat & Integrity (Weeks 5–8)
- [ ] Anti-Cheat SDK: tab-switch, clipboard, DevTools, PrintScreen, keyboard block.
- [ ] Violation event logging API + audit log integration.
- [ ] Auto-submit on configurable threshold (default 3 strikes).
- [ ] Webcam snapshot capture every 15s → Supabase Storage.
- [ ] VM / process blacklist detection (client-side heuristics).
- [ ] Proctor dashboard: live violation feed, snapshot gallery per attempt.

### Phase 3: Grading & Certificates (Weeks 9–12)
- [ ] Server-side blind grading (`SECURITY DEFINER` function).
- [ ] Essay question routing to instructor rubric UI.
- [ ] Certificate of Recognition PDF generation.
- [ ] Email delivery of certificate + result notification.
- [ ] Post-exam analytics: identical-answer detection, time-outlier analysis.

### Phase 4: Hardening & Compliance (Weeks 13–16)
- [ ] SEB integration (`.seb` config download + BEK verification).
- [ ] AI proctoring pipeline (optional add-on): gaze detection, multi-face detection.
- [ ] Hash-chain audit log integrity verifier.
- [ ] GDPR consent flows + data-retention sweeps.
- [ ] EASA compliance report generation (session logs, question bank audit trail).
- [ ] Load testing (500 concurrent candidates).

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Client-side anti-cheat bypassed via VM | Medium | High | Server-side VM heuristics; optional SEB; proctor review |
| Webcam bypass (cover lens) | Medium | Medium | Camera-off detection → warning → auto-submit after 30s |
| Timer manipulation | Low | High | Server-authoritative timer; SSE push; no client clock dependency |
| Question bank leakage | Medium | Critical | Tight scheduling windows; large bank (>5x); versioned questions; approval workflow |
| Access-code sharing | Low | Medium | One-time use + candidate binding + IP fingerprint |
| Certificate forgery | Low | Critical | Cryptographic hash chain; unique CoR ID; verification API |
| GDPR / privacy complaint | Medium | High | Explicit consent at form; minimal data retention; right-to-erasure workflow for non-aviation data |
| Browser compatibility (Fullscreen API) | Low | Low | Graceful fallback: exam blocked until fullscreen entered; mobile detection → redirect |

---

## 10. Verification & Testing Plan

### 10.1 Unit Tests
- Access-code validation logic (one-time, expiry, candidate binding).
- Grading function (MCQ + essay).
- Certificate PDF generation field mapping.
- Hash-chain audit log append + verify.
- Violation threshold logic (auto-submit at N strikes).

### 10.2 Integration Tests
- Full exam flow: create session → generate codes → student registers → attempt → submit → grade → certificate.
- Simultaneous attempts with randomised questions (no two candidates see identical paper).
- Server timer auto-submit when client disconnects.
- SEB header verification (valid vs invalid BEK).

### 10.3 Security Tests
- Attempt to bypass fullscreen (Esc, F11, DevTools) → violation logged.
- Attempt to copy-paste question text → blocked + logged.
- Attempt to open DevTools → detected + flagged.
- Attempt to submit with manipulated answer payload → server-side validation rejects.
- Attempt to reuse access code → rejected.
- Attempt to take exam from two tabs → BroadcastChannel detection blocks second.

### 10.4 EASA Compliance Validation
- Question bank metadata: module, subsection, knowledge level (1/2/3), reference page.
- Exam session log: candidate list, invigilator name, start/end times, location.
- Certificate fields: Part-147 approval number, module, date, score.
- Audit trail: 7-year retention plan documented.

---

## 11. Open Questions & Out-of-Scope Items

### In Scope (this plan)
- MCQ + essay exam delivery.
- Anti-cheat: fullscreen, tab-switch, clipboard, keyboard block, webcam snapshots.
- Access-code gating + pre-exam student form.
- Server-authoritative timer + auto-submit.
- Certificate of Recognition generation.
- Audit log with hash chain.
- Integration into existing Aerojet Academy Next.js app.

### Out of Scope (future phases)
- Live AI proctoring with gaze tracking (requires GPU workers, third-party ML pipeline).
- Biometric continuous authentication (face recognition) — requires consent infrastructure + model hosting.
- Blockchain-based credential verification (BlockProctor-style) — deferred to Phase 4+.
- Mobile exam delivery — desktop-only by design per aviation regulation.
- Multi-tenancy / white-label for external MTOs — single-tenant initially.

### Open Questions for User
1. **Strict key-press auto-submit**: Is the requirement "any key press anywhere" or "any key press outside of answer options"? (Current plan: any key press triggers submit — need confirmation.)
2. **Webcam requirement**: Is webcam capture mandatory for all exams, or only high-stakes modules?
3. **Certificate format**: Do you need a specific EASA template, or is a generic signed PDF sufficient?
4. **SEB deployment**: Will candidates install SEB themselves, or will the school provide managed laptops?

---

## 12. References
- EasyEvaluate Architecture Guide (2026)
- Safe Exam Browser Documentation
- EASA ED Decision 2023/019/R (Part-66/147 review)
- EASA NPA 2023-10 (fraud prevention)
- EASA SIB 2014-32 (HATA fraud case)
- UK CAA Electronic Examination Systems (CAAi / Aspeq)
- QBgenerator Part-66 exam management system
- 360 Aviation Life — secure online exams in aviation
- ResearchGate: ProctorSense, VigilantEx, BlockProctor, ExamShield-AI
- GitHub: take-a-test, mock-test-fullSecurity, ExamSentinel
- Forasoft — Proctoring & Assessment Reference Design (2026)

---

## 13. LLM Council Audit — Consolidated Verification Report

**Audited:** 2026-08-30  
**Council:** 3 independent personas × 3 rounds (Security & Regulatory, Architecture & UX, Implementation Feasibility)  
**Verdict:** NOT READY for production without MUST-FIX remediation. Architecturally sound foundation; multiple critical gaps in trust boundaries, privacy-by-design, EASA "controlled environment" interpretation, and operational readiness.

---

### 13.1 MUST-FIX Issues (Blocking — Resolve Before Implementation)

| # | Issue | Source Council | Required Resolution |
|---|-------|---------------|---------------------|
| 1 | **`SECURITY DEFINER` grading function lacks `search_path` hardening.** Classic PostgreSQL privilege-escalation vector if `search_path` is not locked to `pg_catalog, public`. | Security Auditor | Add `SET search_path = pg_catalog, public` to all `SECURITY DEFINER` functions. Add pre-deploy lint check. |
| 2 | **Server-side paper binding & answer validation missing.** Server must re-derive the candidate's randomised paper and reject any answer whose `questionId` is not in that paper. Client must never receive `isCorrect`. | Security Auditor | Implement server-side paper derivation from `ExamAttempt`. Add negative test asserting `correctAnswer` never in client payload. |
| 3 | **Audit immutability claimed but not enforced.** No DB trigger/RLS preventing UPDATE/DELETE on `audit_logs`; no `previous_hash` constraint. | Security Auditor + EASA Compliance Officer | Add `BEFORE UPDATE/DELETE` trigger denying writes on `audit_logs`. Add `CHECK (previous_hash IS NOT NULL)` constraint. Document chain-verification procedure. |
| 4 | **EASA "controlled environment" gap unresolved.** Plan markets product as "intranet or public SaaS" with optional on-site proctor. NPA 2023-10 and 147.A.100(b)2 require examinations under full organisational control with invigilation. Remote candidates on personal laptops are not in a controlled environment. | EASA Compliance Officer | Explicitly restrict remote/public SaaS to SEB + managed hardware + live invigilation, OR scope product to on-site only. Add `invigilatorId` to `ExamSession`. Document EASA position. |
| 5 | **No DPIA + lawful-basis analysis for biometric data.** Webcam snapshots + behavioural profiling are special-category biometric data under GDPR Article 9. Plan treats privacy as Phase-4 cleanup. | Privacy Advocate | Complete DPIA (Article 35) before any webcam/biometric processing. Separate proctoring consent from truthfulness declaration. Do not rely on involuntary "consent." |
| 6 | **Auto-submit on violations must be flag-and-review, not silent termination.** 3-strike auto-submit risks unlawful denial for high-stakes exams. False positives from accessibility tools, OS dialogs, or flaky fullscreen detection can void a legitimate candidate. | EASA Compliance Officer + Security Auditor | Auto-submit on violations must flag for human review, not silently finalise. Human review required before exam finalisation for high-stakes modules. |
| 7 | **EU AI Act scoping absent.** Gaze detection / "suspicious behaviour" / multi-face proctoring is high-risk AI under Annex III (education). Architecture must define human oversight, accuracy, and data-governance requirements now, or obtain legal sign-off to keep AI proctoring out of scope. | Privacy Advocate | Classify AI proctoring as high-risk. Define human oversight, accuracy controls, and technical documentation requirements, or document legal sign-off for out-of-scope status. |
| 8 | **Access-code candidate-binding happens after form entry, not before.** Code is validated before candidate identity is known, leaving a gap where a shared code reaches the personal-details form. | Security Auditor | Bind/validate candidate identity at code-entry time, not after. The `/exams/[code]` route must resolve the candidate before rendering the form. |
| 9 | **No `ExamAttempt.status` state machine.** Schema lacks explicit status, creating double-submit race condition between manual submit and server-authoritative auto-submit. Row-level lock or `SELECT ... FOR UPDATE` needed for atomic transitions. | Systems Architect | Add `status: String` (`pending`/`active`/`submitted`/`graded`/`certified`/`auto_submitted`) to `ExamAttempt`. Use `SELECT ... FOR UPDATE` on state transitions. |
| 10 | **SSE-per-second timer is a Vercel deployment blocker.** 500 persistent SSE connections with 1-second pushes exhaust Vercel function instances. | Performance Engineer + SRE | Replace with client-side timer + server sync at 30s intervals (or at question boundaries). Enforce deadline at submission time via DB timestamp check. |
| 11 | **Webcam every 15s generates unsustainable Supabase Storage egress.** 240,000 uploads × 20KB = 4.8GB per 2-hour session at 500 candidates. Free tier exceeded; paid tier strained. | Performance Engineer | Reduce to 60-second intervals. Implement client-side stationary-frame deduplication. Add proctor-triggered capture mode for flagged candidates only. |
| 12 | **Auto-submit on any key press violates WCAG 2.1.1 and 2.1.2.** No keyboard trap permitted without exception. The plan has no exception process. | Accessibility Advocate | Document formal accessibility exception for regulated exams. Provide alternative supervised delivery mode for candidates who cannot use the lockdown interface. |
| 13 | **No accommodation for webcam-excluded candidates.** Camera-off auto-submit penalises disabled candidates. | Accessibility Advocate | Add `requiresAlternativeProctoring` flag on `ExamRegistration`. When set, route to human-proctor workflow instead of webcam enforcement. |
| 14 | **Key-press auto-submit semantics undefined.** "Any key press triggers submit" will auto-submit on navigation keys, accessibility tools, and browser focus events within seconds. Debounce does not solve the fundamental issue. | Tech Lead | Clarify requirement with stakeholder. Implement as: (a) explicit Submit button + (b) `Escape` key as secondary trigger with 5s confirmation toast, NOT blanket `document.keydown`. |
| 15 | **GDPR/EASA retention conflict not resolved.** Exam integrity data must be retained 7 years per EASA. PII (passport, photo) must be erasable per GDPR. Current schema has no tiering mechanism. | SRE + Tech Lead | Add `retentionCategory` enum (`INTEGRITY`, `PII`, `BOTH`) to `ExamAttempt`, `ExamAnswer`, `ExamViolation`, `ExamRegistration`. GDPR sweep redacts `PII` columns but preserves `INTEGRITY` rows. |
| 16 | **Server crash recovery not specified.** If server restarts mid-exam, in-flight attempts must be auto-submitted. No startup recovery procedure described. | SRE + QA | Add recovery cron (`POST /api/cron/recover-exams`, gated by `CRON_SECRET`) that runs on startup and every 60s, querying expired attempts and calling the grading function. |
| 17 | **Exam config JSON lacks TypeScript schema.** `Exam.config` is untyped `Json`. Every route handler will access it as `any`, creating type-safety regressions. | Tech Lead | Define `ExamConfig` Zod schema in `lib/validation/exam-schema.ts`. Use in Prisma `@default()` and route validators. |
| 18 | **Security test harness missing.** DevTools detection, fullscreen block, and clipboard block cannot be validated in headless CI. | QA Strategist | Add `playwright.security.config.ts` with `--headed` mode and dedicated `npm run test:security` script. Run on self-hosted runner or on-demand. |
| 19 | **Hash-chain backup/restore validation absent.** Plan tests hash-chain append but not verify-after-restore. | QA Strategist + SRE | Add test that inserts 100 audit rows, exports/imports database, runs hash-chain verifier, and asserts no integrity failures. |
| 20 | **Webcam snapshots bypass existing mirror cron.** Snapshots upload directly to Supabase Storage, not via UploadThing → Supabase mirror. Data loss risk if bucket is deleted. | SRE + Tech Lead | Route webcam uploads through UploadThing (adds redundancy via existing mirror cron), or add separate Supabase-to-S3 export cron for exam paths. |
| 21 | **PDF library and template not locked.** `pdf-lib` is chosen but no template specified. Certificate field alignment, fonts, and Part-147 approval number placement are undefined. | Tech Lead | Before Phase 3, produce locked PDF template (field coordinates, font sizes, EASA layout) and store as reference asset. Build PDF generator against this template. |
| 22 | **Load test target underspecified.** "500 concurrent candidates" stated but test tool, environment, and pass criteria absent. | SRE + QA | Add k6 or autocannon script in `scripts/load-test-exams.js` with clear pass/fail threshold (e.g., 95th percentile timer response < 500ms, zero auto-submit failures under load). |
| 23 | **SEB integration deferred to Phase 4.** SEB is the most effective anti-cheat control. For EASA-regulated exams, SEB should be a Phase 2 toggle, not Phase 4. | Tech Lead | Move SEB `.seb` config download + BEK verification to Phase 2 (with `sebRequired: false` default). Infrastructure ready; candidates can opt in. |
| 24 | **Proctor review queue not modeled.** Plan mentions "human reviewer queue" but no `ProctorReview` or `FlaggedMoment` model exists. Proctor dashboard has no data to query. | Tech Lead | Add `ExamProctorReview` model (or extend `ExamViolation` with `reviewedAt`, `reviewedBy`, `reviewOutcome`) in Phase 1 schema. |

---

### 13.2 RECOMMENDED Improvements (Address During Implementation)

| # | Issue | Source Council | Recommended Action |
|---|-------|---------------|-------------------|
| 25 | **N+1 question delivery risk.** Delivering questions one-at-a-time creates 30,000 queries at scale. | Performance Engineer | Batch-fetch randomised question order on `ExamAttempt` creation. Deliver full ordered array to client in one response, or use cursor-based pagination with `take: 1` + server-side cursor. |
| 26 | **Violation event flood.** Unbatched POSTs per violation will spike during high-violation events. | Performance Engineer | Queue violations client-side, batch-upload as array every 10 seconds or on `beforeunload`. |
| 27 | **Anti-cheat SDK bundle size / jank.** Full SDK + webcam capture + auto-save on low-spec laptops will cause CPU contention. | Performance Engineer + Accessibility Advocate | Lazy-load anti-cheat SDK. Show non-animated loading state. Scope `COEP` headers to exam routes only if using Web Worker for webcam capture. |
| 28 | **Polymorphic answer/grading model gap.** `ExamQuestion` supports MCQ, essay, and MSQ without differentiating the grading path. | Systems Architect | Add `gradingType` field or handle via `ExamAnswer.gradingStatus: 'auto' | 'pending_instructor'`. Document essay routing explicitly. |
| 29 | **Circular dependency risk in anti-cheat SDK.** SDK imports auth, API response, and storage utilities that may import back into exam types. | Systems Architect | Adopt barrel-file pattern (`lib/exam/index.ts`). Define strict dependency rule: SDK → no imports from `lib/audit/`; audit ← imports from `lib/exam/types.ts` only. |
| 30 | **No ARIA live regions or focus management for fullscreen entry.** Screen readers lose context on fullscreen transition. | Accessibility Advocate | Add ARIA live region announcements before/after fullscreen entry. Implement focus trap management with visible focus ring. |
| 31 | **No accessibility exception documentation.** EASA compliance documented; accessibility compliance is not. | Accessibility Advocate | Add `ACCESSIBILITY.md` section documenting: (a) which WCAG criteria are met, (b) which are waived with regulatory justification, (c) the alternative-proctoring pathway. |
| 32 | **Certification numbering not human-auditable.** Certificate ID as hash is cryptographically fine but authorities expect sequential official numbering for traceability. | EASA Compliance Officer | Add sequential, verifiable certificate numbering alongside the hash ID. |
| 33 | **Question bank size for high-stakes modules.** Minimum 5x questions is reasonable but not a regulatory floor. | EASA Compliance Officer | Larger banks (>5x) for high-stakes modules to genuinely defeat memorisation. Wire post-exam statistical analytics to auto-flag questions for review. |

---

### 13.3 ACCEPTABLE Trade-Offs (Document, Don't Block)

| Trade-Off | Justification | Condition |
|-----------|---------------|-----------|
| **Client-side anti-cheat is knowingly bypassable.** No client-side control can be fully tamper-proof. Server-side controls (timer, blind grading, access codes, hash chain) are the real trust boundary. | Client-side violations are signals, not enforcement. | Client-side violations must be logged and reviewed; they are never sole basis for adverse action. |
| **Fullscreen lock cannot be made fully accessible.** Fullscreen is a browser API with no screen-reader-friendly alternative. EASA requires controlled environments. | Document as regulated exception; offer supervised in-person alternative. | Formal accessibility exception documented with legal/compliance sign-off. |
| **500 concurrent candidates on Vercel is unrealistic without architecture changes.** Vercel serverless is not designed for 500 persistent connections. | Acceptable if deployment target is documented. For >200, recommend containerised runtime (Docker/standalone) or separate exam service. | Document realistic concurrency ceiling for chosen deployment target. |
| **Webcam snapshots without AI analysis in Phase 1.** Storing raw snapshots without automated analysis is storage-heavy but provides raw material for human review. | Acceptable if storage costs are budgeted. | Snapshots older than 30 days pruned per GDPR retention policy unless flagged for review. |
| **`pdf-lib` for certificate generation.** Server-side PDF generation is CPU-intensive at scale. | Acceptable for <100 concurrent certificate requests. | If scale exceeds this, move to background job queue (e.g., `bullmq` or Vercel Cron). |
| **Zustand for client state.** Reasonable choice for exam client's local state. | Ensure Zustand store does not hold correct answers or grading logic — that must remain server-authoritative. | Server-authoritative grading via `SECURITY DEFINER` function; client never sees answer keys. |

---

### 13.4 Consolidated Verdict

The plan is **viable with mandatory remediation**. It demonstrates strong regulatory awareness, appropriate reuse of existing Aerojet infrastructure, and a credible defense-in-depth strategy. The three council audits identified **24 MUST-FIX items** and **9 RECOMMENDED improvements** that must be resolved before production deployment.

**The greatest systemic risk is not technical — it is the gap between anti-cheat strictness and accessibility accommodation, and between client-side deterrence and server-side enforcement.** The plan must not proceed to Phase 1 coding until the MUST-FIX items are addressed.

**Council Recommendation:** Approve the plan for implementation contingent on resolution of the 24 MUST-FIX items before Phase 1 begins. Schedule an accessibility exception review with legal/compliance before Phase 2 hardening. Schedule EASA compliance sign-off before any certificate generation goes live.

---

*End of LLM Council Consolidated Verification Report*
