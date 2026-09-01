# SEB Deployment Plan

**Date:** 2026-08-31 **Status:** Ready for implementation **Audience:** IT staff, exam administrators, instructors…

---

## 1. What is SEB?

**Safe Exam Browser (SEB)** is an open-source lockdown browser that transforms any computer into a secure exam kiosk. It prevents students from:

- Opening other applications or browser tabs
- Copying/pasting exam content
- Accessing keyboard shortcuts (F12, Ctrl+C/V, etc.)
- Taking screenshots or screen recordings
- Using DevTools or inspection tools

SEB is the **most effective anti-cheat control** because it operates at the OS level, not just within the browser. For EASA-regulated exams, it is a mandatory component of the "controlled examination environment."

### Key Features

| Feature | Benefit |
| --- | --- |
| **Kiosk mode** | Locks the computer to a single exam URL |
| **Browser Exam Key (BEK)** | Cryptographic verification that the server is legitimate |
| **Configurable rules** | Allow/block specific applications, printers, USB drives |
| **Multi-platform** | Windows, macOS, iOS, Android |
| **Open source** | Free to deploy, no per-seat licensing |

### Why SEB Matters for Aerojet Academy

1. **EASA compliance** — NPA 2023-10 requires "controlled examination environments under full organisational control"
2. **Fraud prevention** — Eliminates tab-switching, copy-paste, and DevTools at the OS level
3. **Managed hardware** — Academy-provided laptops can have SEB pre-installed by IT
4. **Graceful fallback** — Personal laptops can still take exams via the supervised alternative pathway

---

## 2. Current Implementation Status

### Already Implemented

| Component | Status | Location |
| --- | --- | --- |
| `sebRequired` flag on `InternalExamClassSchedule` | ✅ Schema | `prisma/schema.prisma:2028` |
| SEB detection middleware | ✅ Code | `lib/middleware/seb-detection.ts` |
| SEB config download API | ✅ Code | `app/api/staff/exams/internal/sessions/[id]/seb-config/route.ts` |
| BEK constants | ✅ Code | `lib/constants/business-rules.ts` |
| SEB enforcement in exam routes | ✅ Code | `InternalExamInterface.tsx` |

### Missing (This Plan)

| Component | Status |
| --- | --- |
| `.seb` config file generation | ❌ Not implemented |
| BEK verification endpoint | ❌ Not implemented |
| SEB deployment guide | ❌ Not documented |
| Managed laptop imaging script | ❌ Not created |
| SEB version pinning | ❌ Not configured |

---

## 3. SEB Configuration Architecture

### 3.1 Configuration File (`.seb`)

SEB uses `.seb` configuration files (ZIP archives containing XML + crypto keys). The academy needs:

1. **Base template** — Default config for all exams
2. **Exam-specific configs** — Per-session overrides (URL, time window, allowed apps)
3. **BEK pairs** — Private key (server) + public key (config)

### 3.2 Configuration Flow

```
Admin creates exam session
  → System generates .seb config with:
    - start_url: https://merrie-unwagered-eloise.ngrok-free.dev/student/exams/internal/start?sessionId=XXX
    - config_key: public BEK
    - allowed_applications: [] (locked down)
    - show_taskbar: false
    - enable_exit_sequencer: false
  → Config encrypted with admin password
  → Student downloads .seb file
  → Student opens in SEB → BEK verified → exam launches
```

### 3.3 Server-Side BEK Verification

When SEB launches an exam, it sends:

```
X-SafeExamBrowser-RequestHash: <hash>
X-SafeExamBrowser-ConfigKey: <public_key>
```

Server verifies:

1. `RequestHash` matches expected hash for this session
2. `ConfigKey` matches stored BEK
3. Session is active and not expired

---

## 4. Implementation Plan

### Phase 1: SEB Config Generation (Week 1)

**Goal:** Generate valid `.seb` configuration files server-side.

#### 4.1 SEB Config Generator

**File:** `lib/internal-exam/seb-config.ts`

```typescript
export interface SebConfig {
  startUrl: string
  configKey: string
  allowQuit: boolean
  showTaskbar: boolean
  enableExitSequencer: boolean
  allowedApplications: string[]
  blockedApplications: string[]
  enablePrintScreen: boolean
  enableClipboard: boolean
  enableDeveloperTools: boolean
}

export function generateSebConfig(config: SebConfig): Buffer
export function encryptSebConfig(configBuffer: Buffer, password: string): Buffer
```

#### 4.2 BEK Key Pair Generation

**File:** `lib/internal-exam/seb-keys.ts`

```typescript
export interface BekPair {
  publicKey: string
  privateKey: string
  configKey: string
}

export function generateBekPair(): BekPair
export function verifySebRequestHash(requestHash: string, bekPair: BekPair, sessionId: string): boolean
```

#### 4.3 API Route

**File:** `app/api/staff/exams/internal/sessions/[id]/seb-config/route.ts` (already exists, needs update)

- Generate BEK pair per session
- Store `privateKey` encrypted in session metadata
- Return `.seb` file download with `application/octet-stream` content-type

### Phase 2: SEB Deployment Guide (Week 1)

**File:** `docs/guides/seb-deployment.md`

Sections:

1. Download SEB for Windows/macOS/iOS/Android
2. Managed laptop imaging script (PowerShell + MDT/SCCM)
3. IT deployment checklist
4. Student self-installation guide
5. Troubleshooting (BEK mismatch, URL blocked, etc.)

### Phase 3: Admin UI Toggle (Week 2)

**File:** `app/staff/exams/internal/sessions/[id]/seb-config/_components/SebConfigPanel.tsx`

Features:

- Generate `.seb` config with one click
- Download button
- BEK status display (active/expired)
- Copy config to clipboard for manual distribution

---

## 5. Certificate Template & PDF Generation

### 5.1 Admin Toggle

Add `certificateEnabled` boolean to `InternalExamBank`:

```prisma
model InternalExamBank {
  ...
  certificateEnabled Boolean @default(false)
  certificateTemplate String?  // JSON template config
}
```

### 5.2 Certificate Configuration

Admins can configure:

- Template version (EASA Part-66 standard, academy custom)
- Include/exclude fields (score, module list, invigilator name)
- Signature type (digital, none)
- Validity period

### 5.3 PDF Generation

**Library:** `pdf-lib` (server-side, no client deps)

**Flow:**

1. Student passes exam
2. System checks `bank.certificateEnabled`
3. If enabled → generate PDF → store in Supabase Storage
4. Send email with download link
5. If disabled → skip PDF generation

**Certificate Fields:**

| Field | Source | EASA Requirement |
| --- | --- | --- |
| Candidate name | `InternalExamRegistration.fullName` | Passport match |
| Licence category | `InternalExamRegistration.licenceCategory` | B1.1, B1.2, B2, etc. |
| Module(s) | `InternalExamRegistration.moduleCode` | M1–M17 |
| Examination date | `InternalExamRegistration.examDate` | Auto-filled |
| Examination location | `InternalExamSession.location` | Part-147 centre |
| Score | `InternalExamSession.percentage` | Immediate result |
| Pass/fail | `InternalExamSession.passed` | Required |
| Part-147 approval number | `lib/constants/business-rules.ts` | Fixed |
| Unique certificate ID | Hash of session + timestamp | Tamper evidence |
| Digital signature | Future: PKI | Optional |

### 5.4 Implementation Files

```
lib/internal-exam/
  certificates/
    generator.ts      # PDF generation logic
    template.ts       # EASA template definition
    storage.ts        # Supabase Storage upload
    types.ts          # CertificateConfig interface

app/api/student/exams/internal/
  certificate/
    [sessionId]/
      route.ts        # GET certificate PDF
```

---

## 6. Testing Plan

### 6.1 SEB Tests

| Test | Method | Tool |
| --- | --- | --- |
| `.seb` config validates against SEB schema | Load in SEB client | Manual + automated snapshot |
| BEK verification rejects tampered requests | Modify hash → expect 401 | Playwright |
| BEK verification accepts valid requests | Valid hash → expect 200 | Playwright |
| Config download returns binary | GET /seb-config → content-type | Vitest |
| Expired session blocks SEB launch | Expired session → 403 | Vitest |

### 6.2 Certificate Tests

| Test | Method | Tool |
| --- | --- | --- |
| PDF generation produces valid PDF | Generate → parse with `pdf-lib` | Vitest |
| PDF contains required fields | Extract text → assert fields | Vitest |
| Certificate disabled → no PDF generated | `certificateEnabled: false` → no file | Vitest |
| Certificate enabled → PDF generated | `certificateEnabled: true` → file in Storage | Vitest |
| Unique certificate ID per exam | Generate twice → IDs differ | Vitest |
| Storage upload succeeds | Mock Supabase → assert upload | Vitest |
| Email includes download link | Mock sendEmail → assert link | Vitest |

### 6.3 Integration Tests

| Test | Method | Tool |
| --- | --- | --- |
| Full flow: exam → pass → certificate | End-to-end | Playwright |
| Admin toggles certificate on/off | UI test | Playwright |
| Student downloads certificate | Authenticated flow | Playwright |

---

## 7. Implementation Checklist

### SEB

- [ ] `lib/internal-exam/seb-config.ts` — config generator + encryptor
- [ ] `lib/internal-exam/seb-keys.ts` — BEK key pair generation + verification
- [ ] `app/api/staff/exams/internal/sessions/[id]/seb-config/route.ts` — download endpoint
- [ ] `docs/guides/seb-deployment.md` — IT + student guides
- [ ] Add `configKey` field to `InternalExamSession` schema
- [ ] Unit tests for config generation + BEK verification
- [ ] Playwright test for BEK verification flow

### Certificates

- [ ] Add `certificateEnabled` + `certificateTemplate` to `InternalExamBank`
- [ ] `lib/internal-exam/certificates/generator.ts` — PDF generation
- [ ] `lib/internal-exam/certificates/template.ts` — EASA template
- [ ] `lib/internal-exam/certificates/storage.ts` — Supabase upload
- [ ] `app/api/student/exams/internal/certificate/[sessionId]/route.ts` — download endpoint
- [ ] Admin UI toggle in exam bank settings
- [ ] Unit tests for PDF generation + storage
- [ ] Playwright integration test for full flow

---

*End of SEB & Certificate Implementation Plan*