# Internal Exam System — Test Data Seeding Plan

## Objective

Create a fully correlated test environment with one student and one instructor so the complete internal exam journey can be tested: application → acceptance → enrollment → class attendance (historical + current) → theory completion → in-class sessions → internal exam preparation → internal exam sitting → EASA exam prep.

**Status:** Post Rounds 1, 2 & 3 Council Review (Data Architecture, Security & Auth, EASA Compliance, Business Logic, QA Strategy, DevOps Execution, Edge Cases, Performance, Integration)

---

## 0. Seed Script Guardrails (R1-SEC-1)

```typescript
// Top of seed-internal-exam-test.ts
const TEST_EMAIL_DOMAIN = '@test.aerojet-academy.com'
const NOW = new Date()
const SESSION_DURATION_MS = 50 * 60 * 1000 // 50 minutes for active exam

if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_SEED) {
  throw new Error('Refusing to run test seed in production. Set ALLOW_TEST_SEED=true to override.')
}

// All operations use upsert keyed on email/code to make seed idempotent
```

All timestamps in this plan are **relative to NOW** — the seed script computes `new Date(NOW.getTime() + offset)` for every date field.

### SystemSettings (R3-INT-1 — CRITICAL, must be Step 0)

```typescript
// Without these, ALL internal exam APIs return 403
await prismaUnfiltered.systemSetting.upsert({
  where: { key: 'internal_exam_system_enabled' },
  update: { value: 'true' },
  create: { key: 'internal_exam_system_enabled', value: 'true' },
})
await prismaUnfiltered.systemSetting.upsert({
  where: { key: 'certificates_enabled' },
  update: { value: 'true' },
  create: { key: 'certificates_enabled', value: 'true' },
})
await prismaUnfiltered.systemSetting.upsert({
  where: { key: 'pdf_template_system_enabled' },
  update: { value: 'true' },
  create: { key: 'pdf_template_system_enabled', value: 'true' },
})
```

---

## 0A. EASA Question CSV State & Audit History

### Current Module Inventory (`scripts/easa-seed/csvs_answered/`)

| Module    | CSV File | Total Rows | Unanswered | Garbage Removed | Replacements Added | Known Issues                                                  |
| --------- | -------- | ---------- | ---------- | --------------- | ------------------ | ------------------------------------------------------------- |
| M1        | M1.csv   | 455        | 0          | 8               | 17                 | 14 rows with <3 valid options; `(` instead of ° symbol        |
| M2        | M2.csv   | 536        | 0          | 1               | 1                  | Corrupted row 59 replaced                                     |
| M3        | M3.csv   | 1003       | 0          | 38              | 22                 | Diagram-dependent questions removed; replaced with text-based |
| M4        | M4.csv   | 191        | 0          | 0               | 0                  | Clean                                                         |
| M5        | M5.csv   | 635        | 0          | 0               | 0                  | Clean                                                         |
| M6        | M6.csv   | 245        | 0          | 0               | 0                  | Markdown `**` bold markers in question text                   |
| M7        | M7.csv   | 97         | 0          | 0               | 0                  | Clean                                                         |
| M11A      | M11A.csv | 371        | 0          | 0               | 0                  | Clean                                                         |
| M13       | M13.csv  | 519        | 0          | 0               | 0                  | Unicode smart quotes present                                  |
| M17       | M17.csv  | 63         | 0          | 0               | 0                  | Clean                                                         |
| **Total** | —        | **4,115**  | **0**      | **47**          | **40**             | See details below                                             |

### Audit History

| Date       | Action                                                                                        | Outcome                                                             |
| ---------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 2026-09-08 | `audit_all_unanswered.py` — scanned all 10 CSVs for `correctAnswer: ''` / `NEEDS_ANSWER`      | **0/4115 unanswered (100% completion)**                             |
| 2026-09-08 | Removed 37 fake `InternalExamQuestion` records + 3 `InternalExamBank` seeds                   | Cleaned dead weight from prior seeding runs                         |
| 2026-09-08 | `replace_all_unanswered.py` — generated EASA-compliant text questions for M1 (110) + M3 (276) | All unanswered questions replaced with verified answers             |
| 2026-09-08 | M1 manual cleanup: removed 8 non-aviation questions, added 17 EASA replacements               | Non-aviation garbage eliminated                                     |
| 2026-09-08 | M3 manual cleanup: removed 38 diagram-dependent questions, added 22 text-based replacements   | Diagram-dependent questions replaced for text-only exam environment |

### Data-Quality Issues (Deferred — Not Blockers)

1. **14 M1 rows with fewer than 3 valid options** — These fail `valid_options_count < 3` in `audit_all_unanswered.py`. They have non-empty `correctAnswer` so they are not counted as "unanswered," but they violate the EASA 3-option rule. Fix by normalizing option delimiters or regenerating rows.
2. **M1 degree symbol corruption** — `°` rendered as `(` in some cells. Cosmetic; does not affect answer correctness.
3. **M6 markdown bold markers** — `**word**` present in question text. Renderer must strip or display as literal.
4. **M13 Unicode smart quotes** — `''` / `""` present. Normalize to straight quotes if mobile rendering breaks.
5. **Blank `syllabusRef` / `knowledgeLevel`** — Many rows have empty metadata. Populate from EASA Appendix I taxonomy if regulatory reporting requires it.
6. **M1 `correctAnswer` uses letter codes (A/B/C)** while other modules use full option text. Normalize to full option text for consistency.

### Safe-Modify Rule

When editing CSVs in place:

- **Allowed:** `correctAnswer`, `reviewNote`, and row text content
- **Forbidden:** Adding/removing DB seed references or changing column count in `prisma/seed-easa-questions.ts`
- All edits must preserve the existing CSV parse behavior in `prisma/seed-easa-questions.ts`

---

## 1. Test Accounts

### Security-Critical Fields (R1-SEC-2, R1-SEC-3)

Both accounts MUST have:

- `emailVerified: NOW` — INSTRUCTOR and STUDENT login is blocked when null
- `loginAttempts: 0`, `lockedUntil: null`
- `mustChangePassword: false`, `passwordChanged: false`
- `status: 'ACTIVE'`
- `deletedAt: null`

### Instructor Account

| Field             | Value                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| email             | `instructor.internal@test.aerojet-academy.com`                                                                                        |
| role              | `INSTRUCTOR`                                                                                                                          |
| status            | `ACTIVE`                                                                                                                              |
| Academy email     | generated from name                                                                                                                   |
| Password          | bcrypt hash of known test password                                                                                                    |
| twoFactorEnabled  | `true` (R1-SEC-3)                                                                                                                     |
| twoFactorSecret   | `JBSWY3DPEHPK3PXP` (known test TOTP secret)                                                                                           |
| Profile           | full name, DOB, nationality, phone, address                                                                                           |
| InstructorProfile | employeeId, department: "Flight Training", specialization: "Aircraft Systems", modulesQualified: ["M1","M2","M3","M4","M5","M6","M7"] |
| Passkey           | 1 credential via direct `prismaUnfiltered.passkey.create()` (R2-DEV-2) — NOT via API call                                             |
| Wallet            | balance: 0, reserved: 0, available: 0                                                                                                 |

### Student Account

| Field                     | Value                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------ |
| email                     | `student.internal@test.aerojet-academy.com`                                          |
| role                      | `STUDENT`                                                                            |
| status                    | `ACTIVE`                                                                             |
| programmeChoice           | `FULL_TIME_2YEAR`                                                                    |
| selectedLicenseCategories | `["B1", "B2"]`                                                                       |
| Academy email             | generated                                                                            |
| Password                  | bcrypt hash of known test password                                                   |
| emailVerified             | NOW                                                                                  |
| Profile                   | full name, DOB, nationality, phone, address                                          |
| StudentProfile            | studentId, enrollmentType: FULL_TIME, currentYearNumber: 1, currentSemesterNumber: 1 |
| Wallet                    | balance: 5000.00, reserved: 0, available: 5000.00                                    |

### System User (for audit logs)

- `SUPER_ADMIN` user with email `system@test.aerojet-academy.com` — used as `grantedBy`/`createdBy` in audit logs

### Staff Test Account (R3-INT-9)

| Field         | Value                                       |
| ------------- | ------------------------------------------- |
| email         | `staff.exam@test.aerojet-academy.com`       |
| role          | `STAFF`                                     |
| status        | `ACTIVE`                                    |
| emailVerified | NOW                                         |
| Password      | bcrypt hash                                 |
| Profile       | full name, DOB, nationality, phone, address |
| StaffProfile  | employeeId, department: "Exams Department"  |
| Wallet        | balance: 0                                  |
| Permissions   | All `EXAM_*` permissions via RoleGrant      |

---

## 2. Reference / Lookup Tables (R1-DA-1)

### IntakeCycle

| Field       | Value              |
| ----------- | ------------------ |
| name        | `2025-2026 Intake` |
| startDate   | 2025-08-01         |
| endDate     | 2026-07-31         |
| isActive    | true               |
| maxStudents | 200                |

### ApplicationDocumentType (R1-DA-1, R2-DEV-1)

| Code                 | Name                    | Description                 | fileTypes                            | maxSizeMB | isRequired | applicableProgrammes | sortOrder |
| -------------------- | ----------------------- | --------------------------- | ------------------------------------ | --------- | ---------- | -------------------- | --------- |
| `ID_COPY`            | National ID Copy        | Scanned ID document         | application/pdf,image/jpeg,image/png | 4         | true       | []                   | 1         |
| `PASSPORT_PHOTO`     | Passport Photo          | Recent passport photo       | image/jpeg,image/png                 | 4         | true       | []                   | 2         |
| `MEDICAL_CERT`       | Medical Certificate     | Class 2 medical certificate | application/pdf                      | 4         | true       | []                   | 3         |
| `QUALIFICATION_CERT` | Academic Qualifications | Degree/diploma certificates | application/pdf                      | 10        | true       | []                   | 4         |
| `PASSPORT`           | Passport Copy           | Valid passport scan         | application/pdf,image/jpeg,image/png | 4         | true       | []                   | 5         |

### InterviewSchedule + InterviewSlot (R1-DA-1)

- InterviewSchedule: date, startTime, endTime, location, maxCandidates: 10
- InterviewSlot: scheduleId, startTime, endTime, interviewer (instructor userId), candidate (student userId), status: COMPLETED

### StudyPathwayModel

| Field           | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| name            | `Full-Time 2-Year B1/B2`                                    |
| description     | Standard full-time pathway for B1 and B2 license categories |
| programmeType   | FULL_TIME                                                   |
| durationYears   | 2                                                           |
| isActive        | true                                                        |
| **includesOjt** | **true** (R2-BL-9 — OJT validation depends on this)         |

### AcademicTerm (R1-DA-1)

| Pathway | YearNumber | SemesterNumber | LicenseCategory | StartDate  | EndDate    |
| ------- | ---------- | -------------- | --------------- | ---------- | ---------- |
| pathway | 1          | 1              | B1              | 2025-09-01 | 2026-01-30 |
| pathway | 1          | 1              | B2              | 2025-09-01 | 2026-01-30 |

### TermCourseAssignment (R1-DA-1)

| Term         | Course | IsCore | SortOrder |
| ------------ | ------ | ------ | --------- |
| term-Y1S1-B1 | M1     | true   | 1         |
| term-Y1S1-B1 | M2     | true   | 2         |
| term-Y1S1-B1 | M3     | true   | 3         |
| term-Y1S1-B1 | M4     | true   | 4         |
| term-Y1S1-B1 | M6     | true   | 5         |
| term-Y1S1-B1 | M7     | true   | 6         |
| term-Y1S1-B2 | M1     | true   | 1         |
| term-Y1S1-B2 | M2     | true   | 2         |
| term-Y1S1-B2 | M3     | true   | 3         |
| term-Y1S1-B2 | M5     | true   | 4         |
| term-Y1S1-B2 | M6     | true   | 5         |
| term-Y1S1-B2 | M7     | true   | 6         |

### FullTimeProgramme + ProgrammeYear (R1-DA-1)

- FullTimeProgramme: `FULL_TIME_2YEAR`, name, durationMonths: 24
- ProgrammeYear Year 1: programmeId, yearNumber: 1, semesterCount: 2
- ProgrammeYear Year 2: programmeId, yearNumber: 2, semesterCount: 2

### LicenseCategory (R1-DA-1)

| Code | Name          | Description                             | IsEasaCategory |
| ---- | ------------- | --------------------------------------- | -------------- |
| `B1` | B1 Mechanical | Mechanical maintenance license          | true           |
| `B2` | B2 Avionics   | Avionics/electrical maintenance license | true           |

### StudentLicenseTarget (R1-DA-1)

| Student | Category |
| ------- | -------- |
| student | B1       |
| student | B2       |

### Classroom (R1-DA-1)

| Name   | Building      | Floor | Capacity | HasProjector |
| ------ | ------------- | ----- | -------- | ------------ |
| `CR-A` | Main Building | 1     | 30       | true         |
| `CR-B` | Main Building | 2     | 28       | true         |
| `CR-C` | Workshop      | 1     | 20       | false        |
| `CR-D` | Workshop      | 2     | 20       | false        |

### ATAChapter (R1-DA-1)

| Code     | Title                   | SubTitle               |
| -------- | ----------------------- | ---------------------- |
| `ATA-11` | Placards and Markings   | General                |
| `ATA-20` | Standard Practices      | General                |
| `ATA-21` | Air Conditioning        | Environmental Systems  |
| `ATA-24` | Electrical Power        | AC/DC Generation       |
| `ATA-30` | Ice and Rain Protection | De-icing Systems       |
| `ATA-32` | Landing Gear            | Hydraulic Systems      |
| `ATA-33` | Lights                  | Navigation/Positioning |
| `ATA-34` | Navigation              | GPS/INS                |
| `ATA-36` | Pneumatic               | Compressor Systems     |
| `ATA-49` | APU                     | Auxiliary Power Unit   |
| `ATA-71` | Power Plant             | Turbine Engines        |
| `ATA-72` | Turbine Engine          | Hot Section            |

### PdfTemplate (R1-DA-1, R1-DA-10)

| slug            | name                      | isActive |
| --------------- | ------------------------- | -------- |
| `internal_exam` | Internal Exam Certificate | true     |

---

## 3. Application & Acceptance Flow (R1-DA-2, R1-DA-3)

### Application Record

- `userId` → student
- `stage` → `ENROLLED`
- `programmeChoice` → `FULL_TIME_2YEAR`
- `fundingType` → `SELF_FUNDED`
- `intakeCycleId` → intake cycle (R1-DA-1)
- `interviewSlotId` → interview slot (R1-DA-1)
- `medicalStatus` → `CLEARED`

### BondingContract (R2-DEV-1)

- Create BondingContract **with `applicationId`** FK after Application exists
- Do NOT add `bondingContractId` to Application (schema mismatch)

### InterviewSchedule + InterviewSlot (R2-DEV-1)

- InterviewSchedule: date, startTime, endTime, location, maxCandidates: 10
- InterviewSlot: scheduleId, startTime, endTime, **interviewer** (instructor userId), status: COMPLETED
- **NO `candidate` column** — candidate linked via `Application.interviewSlotId`

### ApplicationStageLog (R1-DA-2)

Create log entries for each transition:

1. REGISTERED → 2025-07-15
2. PAYMENT_PENDING → 2025-07-15
3. PAYMENT_SUBMITTED → 2025-07-16
4. PAYMENT_VERIFIED → 2025-07-18
5. APTITUDE_PENDING → 2025-07-20
6. APTITUDE_COMPLETED → 2025-07-22
7. SHORTLISTED → 2025-07-25
8. INTERVIEW_PENDING → 2025-07-26
9. INTERVIEW_SCHEDULED → 2025-07-28
10. INTERVIEW_COMPLETED → 2025-08-01
11. SELECTED → 2025-08-05
12. MEDICAL_PENDING → 2025-08-06
13. MEDICAL_SUBMITTED → 2025-08-10
14. MEDICAL_CLEARED → 2025-08-15
15. ENROLLED → 2025-08-20

### Supporting Documents (R1-DA-1)

For each ApplicationDocumentType, create ApplicationDocument + FileUpload:

1. ID_COPY → FileUpload with test PDF, status: APPROVED
2. PASSPORT_PHOTO → FileUpload with test image, status: APPROVED
3. MEDICAL_CERT → FileUpload with test PDF, status: APPROVED
4. QUALIFICATION_CERT → FileUpload with test PDF, status: APPROVED
5. PASSPORT → FileUpload with test PDF, status: APPROVED

Each ApplicationDocument: `@@unique([applicationId, documentTypeId])` respected.

---

## 4. Academic Structure

### Academic Year & Semester (R1-DA-1)

- AcademicYear: `2025-2026`, `isCurrent: true`
- Semester: `2025-2026-S1`, `isCurrent: true`, `academicYearId` → 2025-2026

### Course Categories

- `AIRFRAME` category
- `POWERPLANT` category
- `CORE` category

### Courses (R1-EASA-9 — EASA module mapping)

| Course                  | Code | Category   | ModuleType | Duration | Price   | EASA Module |
| ----------------------- | ---- | ---------- | ---------- | -------- | ------- | ----------- |
| Mathematics             | M1   | CORE       |            | 120h     | 2500.00 | Module 1    |
| Physics                 | M2   | CORE       |            | 120h     | 2500.00 | Module 3    |
| Electrical Fundamentals | M3   | CORE       |            | 80h      | 2000.00 | Module 5    |
| Airframe Structures     | M4   | SPECIALIST | AIRFRAME   | 100h     | 3000.00 | Module 11A  |
| Powerplant Systems      | M5   | SPECIALIST | POWERPLANT | 100h     | 3000.00 | Module 11B  |
| Human Factors           | M6   | CORE       |            | 40h      | 1500.00 | Module 10   |
| Maintenance Practices   | M7   | CORE       |            | 60h      | 1800.00 | Module 7    |

### Exam Components (per course) (R1-EASA-2 — 3 options, not 4)

Each course gets exam components with **3 options** per MCQ (EASA Part-66 standard):

- M1 → `M1-MATH` (MCQ, 90min, pass: 75%), `M1-MATH-ESSAY` (ESSAY, 60min, pass: 75%) — R1-EASA-3: unified 75% threshold
- M2 → `M2-PHYS` (MCQ, 90min, pass: 75%)
- M3 → `M3-ELEC` (MCQ, 90min, pass: 75%)
- M4 → `M4-AIRFRAME` (MCQ, 90min, pass: 75%)
- M5 → `M5-POWERPLANT` (MCQ, 90min, pass: 75%)
- M6 → `M6-HF` (MCQ, 60min, pass: 75%)
- M7 → `M7-MP` (MCQ, 90min, pass: 75%), `M7-MP-ESSAY` (ESSAY, 60min, pass: 75%)

**Note:** ESSAY components are included but the engine currently filters `isEssay: false`. This is a known limitation — essay questions cannot be selected by `selectInternalExamQuestions` (engine.ts:99). Either the engine must be fixed or ESSAY components removed from testing scope.

### Programme & Pathway (R1-DA-1)

- FullTimeProgramme: `FULL_TIME_2YEAR`
- ProgrammeYear: Year 1, Year 2
- StudyPathwayModel → AcademicTerm → TermCourseAssignment (as above)
- `ProgrammeYear.courses` relation populated via CourseToProgrammeYear

---

## 5. Enrollment & Class Assignment

### Enrollment

- Enrollment record: userId → student, courseId → each course, status: `ACTIVE`, amountPaid per course, academicYearId, semesterId
- `@@unique([userId, courseId, semesterId])` respected — all enrollments share semester 2025-2026-S1
- FullTimeEnrollment: userId → student, programmeId, programmeYearId, status: `ACTIVE`, currentYearNumber: 1, academicYearId

### Classes (R1-DA-1 — with Classroom)

Each course has one active class:

| Class      | Course | Instructor | AcademicYear | Semester | StartDate  | EndDate    | MaxStudents | CurrentStudents | Classroom |
| ---------- | ------ | ---------- | ------------ | -------- | ---------- | ---------- | ----------- | --------------- | --------- |
| M1-2025-S1 | M1     | instructor | 2025-2026    | S1       | 2025-09-01 | 2026-01-30 | 28          | 20              | CR-A      |
| M2-2025-S1 | M2     | instructor | 2025-2026    | S1       | 2025-09-01 | 2026-01-30 | 28          | 20              | CR-B      |
| M3-2025-S1 | M3     | instructor | 2025-2026    | S1       | 2025-09-01 | 2026-01-30 | 28          | 20              | CR-A      |
| M4-2025-S1 | M4     | instructor | 2025-2026    | S1       | 2025-09-01 | 2026-01-30 | 28          | 15              | CR-C      |
| M5-2025-S1 | M5     | instructor | 2025-2026    | S1       | 2025-09-01 | 2026-01-30 | 28          | 15              | CR-D      |
| M6-2025-S1 | M6     | instructor | 2025-2026    | S1       | 2025-09-01 | 2026-01-30 | 28          | 20              | CR-A      |
| M7-2025-S1 | M7     | instructor | 2025-2026    | S1       | 2025-09-01 | 2026-01-30 | 28          | 20              | CR-C      |

---

## 6. Class Sessions (Historical + Current)

### Past Sessions (completed)

For each course, create **20 sessions** from Sep 2025 to Jan 2026:

- Types: THEORY (15 sessions), PRACTICAL (3 sessions for M4/M5/M7), REVISION (1), ASSESSMENT (1)
- Schedule: Mon/Wed/Fri, 09:00-12:00 or 13:00-16:00
- Actual start/end recorded
- ATAChapter codes tagged in `ataChapters` String[] (matching ATAChapter table)

### Upcoming Sessions (current)

- 3-5 sessions per course (Feb-Mar 2026), status: SCHEDULED

---

## 7. Attendance Records (Historical)

### For each past ClassSession (R1-EASA-1 — 80% threshold)

Create AttendanceRecord for the test student:

- Distribution: 85% PRESENT, 10% LATE (5-15 min), 5% ABSENT (with notes)
- Ensure calculated attendance > 80% for every course
- `recordedBy`: instructor userId

### Example M1 (20 sessions):

- PRESENT: 17, LATE: 2 (5min, 10min), ABSENT: 1 ("Medical appointment")
- Calculated: (17 + 2×0.5) / 20 = 90% ✓

---

## 8. Grades / Assessments (R1-EASA-1 — 75% threshold)

### Internal Continuous Assessment (INTERNAL_CA)

- Grade records for ASSESSMENT ClassSessions
- Per course: 2-3 grade entries
- Score range: 75-95 (pass threshold: 75, aligned with EASA)
- Category: `INTERNAL_CA`
- `resultLocked`: true for finalized grades (deprecated field, set explicitly)

### Practical Training Records (R1-DA-1)

- For PRACTICAL sessions in M4, M5, M7
- `ataChapterId` → ATAChapter FK (not just string codes)
- `PracticalTaskCategory`, `PracticalDeliveryMethod`, `PracticalResult` enum values used
- Completed: true, competencyRating: 3-5 scale

---

## 9. OJT Periods (R1-DA-1 — corrected model)

### OJTLogbook + OJTLogbookEntry + OJTMentorAssignment

- OJTLogbook: linked to StudentProfile (not FullTimeEnrollment)
- OJTPeriod entries: startDate, endDate, hoursCompleted, status: COMPLETED
- OJTLogbookEntry: date, hours, tasksPerformed, mentorSignature
- OJTMentorAssignment: mentor (instructor), student, startDate, endDate

### OJT Validation (R1-EASA-8)

- B1 pathway: minimum 1 year (≈ 2000 hours) practical experience
- B2 pathway: minimum 1 year (≈ 2000 hours) practical experience
- Seeded OJT hours must meet or exceed minimums

---

## 10. Transactions & Wallet History

### Wallet Transactions (chronological, R1-SEC-7, R2-BL-1, R2-BL-2)

**TransactionType enum values: TOP_UP, RESERVE, CAPTURE, RELEASE, CREDIT, PAYMENT, ADJUSTMENT. No `DEBIT` type exists.**

All amounts computed from a single running balance starting at 15000.00 (increased to avoid negative balance — R2-BL-1):

| #   | Type    | Amount   | Description                     | Balance After      |
| --- | ------- | -------- | ------------------------------- | ------------------ |
| 1   | PAYMENT | 350.00   | Registration fee                | 14650.00           |
| 2   | PAYMENT | 2500.00  | Course payment - M1             | 12150.00           |
| 3   | PAYMENT | 2500.00  | Course payment - M2             | 9650.00            |
| 4   | PAYMENT | 2000.00  | Course payment - M3             | 7650.00            |
| 5   | PAYMENT | 3000.00  | Course payment - M4             | 4650.00            |
| 6   | PAYMENT | 3000.00  | Course payment - M5             | 1650.00            |
| 7   | PAYMENT | 1500.00  | Course payment - M6             | 150.00             |
| 8   | PAYMENT | 1800.00  | Course payment - M7             | 0.00 available     |
| 9   | TOP_UP  | 15000.00 | Wallet top-up TXN-2025-001      | 15000.00           |
| 10  | RESERVE | 520.00   | Internal exam reserve - M1-MATH | 14480.00 available |
| 11  | CAPTURE | 520.00   | Internal exam fee - M1-MATH     | 14480.00           |
| 12  | RESERVE | 520.00   | Internal exam reserve - M3-ELEC | 13960.00 available |

---

## 11. Internal Exam Preparation (R1-EASA-1, R1-DA-1)

### Internal Exam Banks

| Bank         | Course | ModuleCode | RuleSet | MCQ Count | Status   | categoryCode |
| ------------ | ------ | ---------- | ------- | --------- | -------- | ------------ |
| M1-MATH-BANK | M1     | M1-MATH    | EASA    | 40        | APPROVED | B1           |
| M2-PHYS-BANK | M2     | M2-PHYS    | EASA    | 40        | APPROVED | B2           |
| M3-ELEC-BANK | M3     | M3-ELEC    | EASA    | 40        | APPROVED | B2           |

### Questions per Bank (R1-EASA-2, R1-EASA-3, R3-INT-3, R3-INT-4)

- 40 MCQ questions per bank (R1-EASA-2: **3 options**, not 4)
- `submittedById`: **instructor User ID** (R3-INT-3 — required for "My Questions" tab)
- `knowledgeLevel` distribution (R1-EASA-3): L1: 10, L2: 14, L3: 16 per bank
- `explanation`: **5-10 questions per bank** have explanations (R3-INT-8 — results page "Show Explanations")
- `correctAnswer`: exact option text string (R3-INT-16)
- `options`: JSON array of 3 strings (R3-INT-16)
- `status: APPROVED`

### Rule Overrides (R1-DA-1)

- Default EASA rules for all 3 banks:
  - passMarkPct: 75 (R1-EASA-1: aligned with EASA)
  - timePerQuestionSecs: 75
  - retakeWaitDays: 90
  - maxRetakes: 3
  - completionWindowYears: 10

### Bank-Instructor Assignments (R1-DA-1, R1-SEC-4)

- Use `InternalExamBankInstructor.instructorId` → **InstructorProfile.id** (NOT User.id — common footgun)
- canEdit, canReview, canMonitor, canPublish: true

### RBAC Permission Grants (R1-SEC-4)

Create `RoleGrant` rows for the instructor's User ID:

- `EXAM_BANK_EDIT`, `EXAM_BANK_REVIEW`, `EXAM_SESSION_MONITOR`, `EXAM_RESULTS_PUBLISH`, `EXAM_SESSION_EXTEND`, `EXAM_VIOLATION_REVIEW`

### Class Schedules (R1-DA-1, R3-INT-6)

- Link each bank to its class via `InternalExamClassSchedule`
- sebRequired: **false for M1-MATH and M2-PHYS** (basic test)
- sebRequired: **false for M3-ELEC** (SEB test deferred — all false keeps routes accessible)
- `sebConfig` JSON: NOT set on banks (avoids SEB validation gate)
- scheduledStart/End for exam window

---

## 12. Internal Exam Sessions

### Completed Sessions (history)

| Session      | Student | Bank         | Class      | Status    | Score | %   | Passed | Attempt | StartedAt | SubmittedAt   |
| ------------ | ------- | ------------ | ---------- | --------- | ----- | --- | ------ | ------- | --------- | ------------- |
| M1-SESSION-1 | student | M1-MATH-BANK | M1-2025-S1 | COMPLETED | 32    | 80  | true   | 1       | NOW-30d   | NOW-30d+50min |
| M2-SESSION-1 | student | M2-PHYS-BANK | M2-2025-S1 | COMPLETED | 30    | 75  | true   | 1       | NOW-15d   | NOW-15d+50min |

## 11B. Additional Test Scenarios (R2-QA-1 through R2-QA-4)

### Failed Exam (score below 75%)

| Session         | Bank         | Status    | Score | %    | Passed | Attempt |
| --------------- | ------------ | --------- | ----- | ---- | ------ | ------- |
| M3-SESSION-FAIL | M3-ELEC-BANK | COMPLETED | 29    | 72.5 | false  | 1       |

### Retake Chain (R2-BL-6, R2-QA-2)

| Session       | Bank         | Status    | Attempt | Notes                           |
| ------------- | ------------ | --------- | ------- | ------------------------------- |
| M1-SESSION-R1 | M1-MATH-BANK | COMPLETED | 1       | First pass, score 78%           |
| M1-SESSION-R2 | M1-MATH-BANK | COMPLETED | 2       | Retake after 91 days, score 85% |

### Attendance Boundary Values (R2-QA-2)

- **Exactly 80%**: One course where 16 PRESENT + 4 LATE = 80% (tests pass/fail toggle)
- **Exactly 79% (fail)**: One course where 15 PRESENT + 2 LATE + 3 ABSENT = 76% (tests exam eligibility block)

### Max Capacity Class (R2-QA-4)

- One class with `currentStudents = maxStudents = 28`
- Additional student attempting to enroll → REJECTED or waitlisted

### EASA Booking Lifecycle (R2-QA-1)

- M1-MATH booking: `status: CONFIRMED`
- M2-PHYS booking: `status: REJECTED` (tests rejection flow)
- M3-ELEC booking: `status: CANCELLED` (tests cancellation)

### Payment Failure (R2-QA-1)

- WalletTransaction: type: `PAYMENT`, amount: 500.00, but balance insufficient → status: FAILED
- Enrollment: `status: PENDING_PAYMENT` for one course

### Document Rejection (R2-QA-1)

- One ApplicationDocument with `status: REJECTED`, `rejectionReason: "Document unclear, please resubmit"`

### Interview No-Show (R2-QA-1)

- InterviewSlot with `status: MISSED`

### Medical Clearance Failure (R2-QA-1)

- Application with `medicalStatus: PENDING_MEDICAL` (separate test application, or alternate student)

### Expired Access Code (R2-QA-1)

- InternalExamAccessCode with `expiresAt` in past, `used: false`

### Wallet Reserve Release (R2-QA-1)

- RESERVE for M2-ELEC exam → RELEASE (exam cancelled, no CAPTURE)

### FLAGGED Session (R2-BL-12)

| Session         | Bank         | Status  | Notes                               |
| --------------- | ------------ | ------- | ----------------------------------- |
| M1-SESSION-FLAG | M1-MATH-BANK | FLAGGED | tabSwitchCount: 3, violation logged |

### Prerequisite Course (R2-BL-5)

- M2 requires `requiresPrerequisite: true`, prerequisite: M1
- Student has passed M1 → M2 enrollment ALLOWED
- (If testing negative: alternate student without M1 → M2 enrollment BLOCKED)

### Retake Wait Boundary (R2-QA-2)

- M1-SESSION-TIMEOUT2: startedAt = NOW - 89 days (retake NOT yet eligible)
- M1-SESSION-TIMEOUT3: startedAt = NOW - 91 days (retake ELIGIBLE)

### Exam Already Expired (R2-QA-2)

- InternalExamAccessCode with `expiresAt = NOW` (already expired, tests auto-reject)

### Multiple Void Reasons (R2-QA-1)

| Session         | VoidReason          |
| --------------- | ------------------- |
| M2-SESSION-VOID | "Technical issue"   |
| M3-SESSION-VOID | "Cheating detected" |

### Negative Test Accounts (R2-QA-3)

- `locked.student@test.aerojet-academy.com`: loginAttempts: 5, lockedUntil: NOW + 24h
- `suspended.student@test.aerojet-academy.com`: status: SUSPENDED

### Second Instructor with Limited RBAC (R2-QA-4)

- `instructor.limited@test.aerojet-academy.com`: only EXAM_SESSION_MONITOR grant, no publish rights
- Tests permission boundary

## 11C. OJT Pathway Flag (R2-BL-9)

StudyPathwayModel must have:

- `includesOjt: true` — required for OJT access validation

## 12. Internal Exam Sessions

### Active Session Seeding Approach (R2-BL-3, R2-BL-10)

**Do NOT insert directly as `IN_PROGRESS`.** Instead:

1. Seed as `NOT_STARTED` with `startedAt: null`, `expiresAt: null`
2. Call the session-start API endpoint (`POST /api/student/exams/internal/start`) or invoke `transitionExamSession` to move to `IN_PROGRESS`
3. This validates the state machine, eligibility checks, and attemptNumber logic

### Completed Sessions (history)

| Session      | Student | Bank         | Class      | Status    | Score | %   | Passed | Attempt | StartedAt | SubmittedAt   |
| ------------ | ------- | ------------ | ---------- | --------- | ----- | --- | ------ | ------- | --------- | ------------- |
| M1-SESSION-1 | student | M1-MATH-BANK | M1-2025-S1 | COMPLETED | 32    | 80  | true   | 1       | NOW-30d   | NOW-30d+50min |
| M2-SESSION-1 | student | M2-PHYS-BANK | M2-2025-S1 | COMPLETED | 30    | 75  | true   | 1       | NOW-15d   | NOW-15d+50min |

### Active Session (seeded as NOT_STARTED, transitioned to IN_PROGRESS via API)

| Field           | Value                                                     |
| --------------- | --------------------------------------------------------- |
| studentId       | student                                                   |
| bankId          | M3-ELEC-BANK                                              |
| classId         | M3-2025-S1                                                |
| status          | `NOT_STARTED` → `IN_PROGRESS` (via transitionExamSession) |
| ruleSet         | `EASA`                                                    |
| attemptNumber   | 1 (set by engine on start)                                |
| tabSwitchCount  | 0                                                         |
| fullscreenExits | 0                                                         |
| keyboardEvents  | 0                                                         |
| ipAddress       | `127.0.0.1`                                               |
| userAgent       | test user agent                                           |
| supervised      | false                                                     |
| isPublished     | false                                                     |
| reserveTxnId    | linked to WalletTransaction #12                           |

### Additional Session States for Testing (R1-EASA-5, R2-QA-1, R2-BL-6, R2-QA-2)

| Session             | Bank         | Status    | Score | %    | Passed | Attempt | Notes                                           |
| ------------------- | ------------ | --------- | ----- | ---- | ------ | ------- | ----------------------------------------------- |
| M1-SESSION-1        | M1-MATH-BANK | COMPLETED | 32    | 80   | true   | 1       | Standard pass                                   |
| M2-SESSION-1        | M2-PHYS-BANK | COMPLETED | 30    | 75   | true   | 1       | Exactly at threshold                            |
| M3-SESSION-FAIL     | M3-ELEC-BANK | COMPLETED | 29    | 72.5 | false  | 1       | Below threshold (R2-QA-1)                       |
| M1-SESSION-TIMEOUT  | M1-MATH-BANK | TIMED_OUT | —     | —    | —      | 1       | Expired without submission, autoSubmitted: true |
| M2-SESSION-VOID     | M2-PHYS-BANK | VOIDED    | —     | —    | —      | 1       | VoidReason: "Technical issue"                   |
| M3-SESSION-VOID     | M3-ELEC-BANK | VOIDED    | —     | —    | —      | 1       | VoidReason: "Cheating detected"                 |
| M1-SESSION-FLAG     | M1-MATH-BANK | FLAGGED   | —     | —    | —      | 1       | tabSwitchCount: 3, violation logged (R2-BL-12)  |
| M1-SESSION-R1       | M1-MATH-BANK | COMPLETED | 31    | 77.5 | true   | 1       | First attempt (R2-BL-6)                         |
| M1-SESSION-R2       | M1-MATH-BANK | COMPLETED | 34    | 85   | true   | 2       | Retake after 91 days (R2-QA-2)                  |
| M1-SESSION-TIMEOUT2 | M1-MATH-BANK | TIMED_OUT | —     | —    | —      | 2       | startedAt: NOW-89d (retake NOT yet eligible)    |
| M1-SESSION-TIMEOUT3 | M1-MATH-BANK | TIMED_OUT | —     | —    | —      | 2       | startedAt: NOW-91d (retake ELIGIBLE)            |

### Answers for Active Session (R3-INT-2 — 5-10 answers with questionOrder)

- 5-10 sample answers (mixing correct/incorrect)
- answeredAt timestamps between startedAt and now
- isCorrect calculated per question
- **questionOrder**: JSON array of 10 randomly ordered question IDs from M3-ELEC-BANK (R3-INT-4 — required for resume/render)
- The 5-10 answer rows link to the first 5-10 IDs in questionOrder

### Answers for Completed Sessions

- 40 answers each (all questions answered)
- Score and percentage calculated

### Access Codes (R1-SEC-10)

```typescript
const generateAccessCode = () => crypto.randomBytes(6).toString('hex').toUpperCase() // 12-char hex
```

- Generated for each session
- expiresAt: session expiresAt (for active), session submittedAt (for completed)
- used: false (active), true (completed)

### Registrations (R1-DA-1)

- Linked to each session, `@@unique([sessionId, userId])` respected
- Full candidate details: fullName, dateOfBirth, nationality, email, phone
- licenceCategoryId → LicenseCategory "B2" (R1-DA-1)
- examDate, examLocation
- candidatePhoto, idDocumentType, idDocumentNumber
- consents: all true
- modules: ["M3-ELEC"]

### InternalExamViolation Records (R3-INT-6)

For the FLAGGED session (M1-SESSION-FLAG):

| Field         | Value                                           |
| ------------- | ----------------------------------------------- |
| sessionId     | M1-SESSION-FLAG                                 |
| studentId     | student                                         |
| classId       | M1-2025-S1                                      |
| bankId        | M1-MATH-BANK                                    |
| type          | `TAB_SWITCH`                                    |
| severity      | `WARNING`                                       |
| detail        | "3 tab switches detected during exam session"   |
| deviceInfo    | `{ userAgent: "test-agent", timestamp: "..." }` |
| reviewed      | false                                           |
| reviewOutcome | null                                            |

### InternalExamReport Records (R3-INT-7)

For M2-SESSION-1 (completed):

| Field      | Value                                             |
| ---------- | ------------------------------------------------- |
| sessionId  | M2-SESSION-1                                      |
| studentId  | student                                           |
| status     | `PENDING`                                         |
| reason     | "Question 23 appears to have two correct answers" |
| questionId | (one of the M2-PHYS-BANK question IDs)            |
| resolvedAt | null                                              |

---

## 13. Certificates (R1-DA-10)

### For completed passed sessions

| Field         | Value                       |
| ------------- | --------------------------- |
| certificateId | `CERT-M1-2025-001` (unique) |
| sessionId     | M1-SESSION-1                |
| studentId     | student                     |
| courseId      | M1                          |
| moduleCode    | M1-MATH                     |
| score         | 32                          |
| percentage    | 80.0                        |
| template      | `internal_exam`             |
| pdfUrl        | placeholder                 |
| issuedAt      | session submittedAt         |
| issuedBy      | instructor                  |
| verified      | true                        |

**Note:** QR codes on PDFs link to `/verify/{certificateId}` which is a dead endpoint (DocumentVerification model is dead code per project audit). Testers should not expect QR verification to work.

---

## 14. Additional Supporting Data (R1-DA-1 corrections)

### Notifications

- Enrollment confirmation, class schedule, exam registration, exam reminder, result published

### Messages (R1-DA-1 — MessageReaction does NOT exist)

- Thread between student and instructor about exam preparation
- NO MessageReaction records (model doesn't exist)

### Audit Logs (R1-SEC-6, R1-DA-1)

Every security-critical action gets an AuditLog:

- `USER_ENROLLED` — student enrollment approved
- `CLASS_ASSIGNED` — student assigned to classes
- `EXAM_BANK_INSTRUCTOR_ASSIGNED` — instructor assigned to bank
- `EXAM_SCHEDULE_CREATED` — exam schedule created
- `EXAM_ACCESS_CODE_GENERATED` — access code generated
- `SESSION_STATUS_CHANGED` — session started/completed
- `EXAM_RESULT_PUBLISHED` — result published
- `CERTIFICATE_ISSUED` — certificate issued
- Top-level `SYSTEM` entry for seed execution

### Calendar Events (R1-DA-1)

- AdminCalendarEvent: class schedules, exam sessions
- StudentCalendarEvent: student's personal schedule
- visibleTo: CalendarAudience enum
- classId/examEventId FKs populated

### Exam Events (EASA bridge)

- EASA-2026-S1: DRAFT, future exam event
- ExamPool: linked to event
- ExamSitting: morning/afternoon sessions

### Exam Bookings (EASA bridge)

- Student booking: examComponentId → M1-MATH exam component
- bookingType: INDIVIDUAL, status: PENDING
- This shows the bridge: internal exam passed → ready for EASA official exam

### Cron Job Test Data (R3-INT-12, R3-INT-13)

- **exam-timeout cron**: One IN_PROGRESS session with `expiresAt: NOW - 5min`, `lastActivityAt: NOW - 10min` — triggers auto-timeout
- **recover-exams cron**: One IN_PROGRESS session with `expiresAt: NOW - 1h`, `submittedAt: null` — triggers recovery
- These are separate from the "active but running" M3 session

---

## 15. Seed Script Structure

Create `prisma/seed-internal-exam-test.ts`:

```typescript
// All timestamps computed relative to NOW
// All creates use upsert for idempotency (R1-SEC-9)
// Production guard at top (R1-SEC-1)
// emailVerified set for all accounts (R1-SEC-2)
// 2FA enabled for instructor (R1-SEC-3)
// RoleGrant for instructor permissions (R1-SEC-4)
// Access codes use crypto.randomBytes (R1-SEC-10)
// Audit logs for every security-critical action (R1-SEC-6)

// Step 1: System user (for audit logs)
// Step 2: Reference tables (IntakeCycle, ApplicationDocumentType, etc.)
// Step 3: Instructor user + profile + passkey + RBAC grants
// Step 4: Student user + profile + studentProfile + license targets
// Step 5: Application + stage logs + documents
// Step 6: Academic structure (year, semester, categories, courses, components)
// Step 7: Pathway, programme, terms, assignments
// Step 8: Enrollments (Enrollment + FullTimeEnrollment)
// Step 0: SystemSettings (R3-INT-1 — must be first, blocks all APIs if missing)
// Step 1: System user (for audit logs)
// Step 2: Reference tables (IntakeCycle, ApplicationDocumentType, etc.)
// Step 3: Instructor user + profile + passkey (direct DB insert) + RBAC grants
// Step 4: Staff user + profile + permissions (R3-INT-9)
// Step 5: Student user + profile + studentProfile + license targets
// Step 6: Application + stage logs + documents
// Step 7: Academic structure (year, semester, categories, courses, components)
// Step 8: Pathway, programme, terms, assignments
// Step 9: Enrollments (Enrollment + FullTimeEnrollment)
// Step 10: Classes + classrooms + sessions
// Step 11: Attendance records
// Step 12: Grades + practical training
// Step 13: OJT logbook + entries + mentor assignments
// Step 14: Wallet + transactions
// Step 15: Internal exam banks + questions (3 options, knowledge levels, submittedById, explanations)
// Step 16: Rule overrides + instructor assignments
// Step 17: Class schedules
// Step 18: Exam sessions (completed, timed-out, voided, active, flagged, fail, retake chain)
// Step 19: Answers (with questionOrder for active session) + access codes + registrations
// Step 20: InternalExamViolation + InternalExamReport records
// Step 21: Certificates
// Step 22: Notifications + messages + audit logs + calendar events
// Step 23: EASA exam event + pool + sitting + booking
// Step 24: Cron test data (expired sessions for exam-timeout and recover-exams)
```

### Execution Notes (R2-DEV-3, R2-DEV-4, R3-PERF-1 through R3-PERF-10)

- **Use `prismaUnfiltered`** for all queries (no RLS overhead in seed context)
- **Use dependency-based batches** instead of one giant `$transaction` (R3-PERF-1) — 8-10 independent batches with `Promise.all`
- **Pre-seed Permission keys** before creating RoleGrants
- **Use `createMany`** for ALL bulk inserts: ClassSessions, ExamQuestions, ApplicationStageLogs, AttendanceRecords, Answers, Notifications, Messages, OJTEntries, Grades, PracticalTrainingRecords
- **Replace HTTP session start with direct DB update** (R3-PERF-5) — no API call during seeding
- **Parallelize independent groups** — target **3-5s** execution time (R3-PERF-2)
- **Pre-existence batching** to eliminate SELECT overhead in upserts
- **Cleanup implementation**: delete by test email domain cascade, plus manual cleanup for tables without User cascade

```typescript
// Cleanup implementation
export async function cleanupTestData(tx: PrismaClient) {
  // Cascade delete from User removes: Profile, StudentProfile, InstructorProfile,
  // Wallet + WalletTransaction, Certificate, InternalExamSession + children,
  // AttendanceRecord, Grade, PracticalTrainingRecord, OJTLogbook + children,
  // Application + ApplicationStageLog + ApplicationDocument,
  // Notification, Message, ExamBooking, ExamResult, ExamSittingAssignment,
  // InternalExamRegistration, InternalExamViolation, InternalExamReport
  await tx.user.deleteMany({ where: { email: { endsWith: '@test.aerojet-academy.com' } } })

  // Manual cleanup for tables without User cascade
  await tx.internalExamBank.deleteMany({ where: { name: { startsWith: 'M' } } })
  await tx.class.deleteMany({ where: { name: { startsWith: 'M' } } })
  await tx.classroom.deleteMany({ where: { name: { startsWith: 'CR' } } })
  await tx.ataChapter.deleteMany({ where: { code: { startsWith: 'ATA' } } })
  await tx.licenseCategory.deleteMany({ where: { code: { in: ['B1', 'B2'] } } })
  await tx.pdfTemplate.deleteMany({ where: { slug: 'internal_exam' } })
  await tx.intakeCycle.deleteMany({ where: { name: '2025-2026 Intake' } })
  await tx.applicationDocumentType.deleteMany({ where: { slug: { in: [...] } } })
  await tx.permission.deleteMany({ where: { key: { startsWith: 'EXAM_' } } })
}
```

### Execution

```bash
# Against test database only
bun run db:seed -- --seed=prisma/seed-internal-exam-test.ts

# Cleanup (R1-SEC-12)
bun run db:seed -- --seed=prisma/seed-internal-exam-test.ts --cleanup
```

---

## 16. Verification Checklist

After seeding, verify:

- [ ] Production guard blocks execution if NODE_ENV=production without ALLOW_TEST_SEED
- [ ] SystemSetting `internal_exam_system_enabled = true` (R3-INT-1 — without it, all APIs return 403)
- [ ] SystemSetting `certificates_enabled = true` and `pdf_template_system_enabled = true`
- [ ] Student can log in (emailVerified set)
- [ ] Instructor can log in with 2FA (known TOTP secret works)
- [ ] Instructor can use passkey (credential exists in DB)
- [ ] Staff account can access staff exam routes (publish, supervise, extend)
- [ ] Application shows ENROLLED stage with stage history
- [ ] All 7 courses show in enrollment list
- [ ] All classes show with correct instructor and classroom
- [ ] Attendance history shows >80% across all courses
- [ ] One course has exactly 80% attendance (boundary)
- [ ] One course has <80% attendance (exam eligibility blocked)
- [ ] Grades show for assessment sessions (75% threshold)
- [ ] Wallet shows correct balance and transaction history (no negative)
- [ ] Internal exam dashboard shows 3 available banks with categoryCode
- [ ] Completed sessions (M1, M2) show with certificates
- [ ] Failed session (M3-SESSION-FAIL) shows no certificate
- [ ] Retake chain visible (M1-SESSION-R1 → M1-SESSION-R2)
- [ ] Active session (M3) has answers and questionOrder (R3-INT-2, R3-INT-4)
- [ ] Active session (M3) can be started via state machine transition
- [ ] TIMED_OUT sessions exist (including retake boundary tests)
- [ ] VOIDED sessions exist with different reasons
- [ ] FLAGGED session exists with violation logged
- [ ] InternalExamViolation record linked to FLAGGED session (R3-INT-6)
- [ ] InternalExamReport record for completed session (R3-INT-7)
- [ ] "My Questions" tab shows 120 questions (submittedById set) (R3-INT-3)
- [ ] Results page shows explanations for some questions (R3-INT-8)
- [ ] Instructor can manage exam banks (RBAC grants work)
- [ ] Limited instructor CANNOT publish (RBAC boundary test)
- [ ] Notifications show relevant alerts (including negative events)
- [ ] EASA booking lifecycle (CONFIRMED, REJECTED, CANCELLED)
- [ ] Calendar events visible to student
- [ ] OJT logbook entries exist and pathway includesOjt is true
- [ ] Prerequisite course validation works
- [ ] Max capacity class blocks new enrollment
- [ ] Expired access codes rejected
- [ ] Locked/suspended accounts cannot log in
- [ ] Cron test data exists for exam-timeout and recover-exams
- [ ] All upsert-safe (re-running seed doesn't duplicate)

---

## 17. Data Volume Summary

| Entity                                   | Count                                                                                                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| System Users                             | 3 (super_admin, instructor, staff)                                                                                                                       |
| Test Users                               | 1 (student) + 2 negative test accounts                                                                                                                   |
| Profiles                                 | 3                                                                                                                                                        |
| Passkeys                                 | 1                                                                                                                                                        |
| RoleGrants                               | 8+ (instructor + staff)                                                                                                                                  |
| SystemSettings                           | 3 (internal_exam_system_enabled, certificates_enabled, pdf_template_system_enabled)                                                                      |
| Application                              | 1                                                                                                                                                        |
| ApplicationStageLog                      | 15                                                                                                                                                       |
| ApplicationDocumentType                  | 5                                                                                                                                                        |
| ApplicationDocument + FileUpload         | 5                                                                                                                                                        |
| IntakeCycle                              | 1                                                                                                                                                        |
| InterviewSchedule + Slot                 | 1                                                                                                                                                        |
| BondingContract                          | 1                                                                                                                                                        |
| AcademicYear                             | 1                                                                                                                                                        |
| Semester                                 | 1                                                                                                                                                        |
| CourseCategories                         | 3                                                                                                                                                        |
| Courses                                  | 7                                                                                                                                                        |
| ExamComponents                           | 10-12                                                                                                                                                    |
| StudyPathwayModel                        | 1                                                                                                                                                        |
| AcademicTerm                             | 2                                                                                                                                                        |
| TermCourseAssignment                     | 12                                                                                                                                                       |
| FullTimeProgramme + ProgrammeYear        | 3                                                                                                                                                        |
| LicenseCategory                          | 2                                                                                                                                                        |
| StudentLicenseTarget                     | 2                                                                                                                                                        |
| Classroom                                | 4                                                                                                                                                        |
| ATAChapter                               | 12                                                                                                                                                       |
| PdfTemplate                              | 1                                                                                                                                                        |
| Enrollments                              | 7                                                                                                                                                        |
| FullTimeEnrollment                       | 1                                                                                                                                                        |
| Classes                                  | 7                                                                                                                                                        |
| ClassSessions                            | ~140                                                                                                                                                     |
| AttendanceRecords                        | ~140                                                                                                                                                     |
| Grades                                   | ~15                                                                                                                                                      |
| PracticalTrainingRecords                 | ~9                                                                                                                                                       |
| OJTLogbook + Entries + MentorAssignments | ~10                                                                                                                                                      |
| WalletTransactions                       | 12 (+ reserve for active M3 exam)                                                                                                                        |
| InternalExamBanks                        | 3                                                                                                                                                        |
| InternalExamQuestions                    | 120 (with explanations on 5-10 per bank)                                                                                                                 |
| InternalExamRuleOverrides                | 3                                                                                                                                                        |
| InternalExamBankInstructors              | 3                                                                                                                                                        |
| InternalExamClassSchedules               | 3                                                                                                                                                        |
| InternalExamSessions                     | 14 (2 completed pass, 1 fail, 2 retake chain, 3 timed-out boundary, 2 voided, 1 flagged, 1 active NOT_STARTED, 1 active IN_PROGRESS, 1 expired for cron) |
| InternalExamAnswers                      | 135+ (40 per completed + 10 active with questionOrder)                                                                                                   |
| InternalExamAccessCodes                  | 6+ (including expired)                                                                                                                                   |
| InternalExamRegistrations                | 6+ (including PENDING for active)                                                                                                                        |
| InternalExamViolation                    | 1 (linked to FLAGGED session)                                                                                                                            |
| InternalExamReport                       | 1 (linked to completed session)                                                                                                                          |
| Certificates                             | 2                                                                                                                                                        |
| Notifications                            | 15+ (including negative events)                                                                                                                          |
| Messages                                 | 5-10                                                                                                                                                     |
| AuditLogs                                | 25+                                                                                                                                                      |
| CalendarEvents                           | 20+                                                                                                                                                      |
| ExamEvent + Pool + Sitting               | 1 each                                                                                                                                                   |
| ExamBooking                              | 3 (CONFIRMED, REJECTED, CANCELLED)                                                                                                                       |
| CronTestSessions                         | 2 (for exam-timeout and recover-exams)                                                                                                                   |

**Total records: ~600-700**

---

## 18. Round 1 Council Findings Applied

| Finding                                                  | Source               | Applied        |
| -------------------------------------------------------- | -------------------- | -------------- |
| Production seed guard                                    | R1-SEC-1             | Section 0      |
| emailVerified + 2FA for test accounts                    | R1-SEC-2, R1-SEC-3   | Section 1      |
| RoleGrant permissions for instructor                     | R1-SEC-4             | Section 11     |
| Passkey credential for instructor                        | R1-SEC-5             | Section 1      |
| Audit logs for seed actions                              | R1-SEC-6             | Section 14     |
| Email isolation via test domain                          | R1-SEC-7             | Throughout     |
| Crypto-random access codes                               | R1-SEC-10            | Section 12     |
| Idempotent upsert pattern                                | R1-SEC-9             | Throughout     |
| Cleanup function                                         | R1-SEC-12            | Section 15     |
| Missing lookup tables (IntakeCycle, etc.)                | R1-DA-1              | Section 2      |
| ApplicationStageLog + FileUpload                         | R1-DA-2              | Section 2      |
| StudyPathway + AcademicTerm + Assignments                | R1-DA-1              | Section 4      |
| LicenseCategory + StudentLicenseTarget                   | R1-DA-1              | Section 2      |
| Classroom assignment                                     | R1-DA-1              | Section 5      |
| ATAChapter lookup                                        | R1-DA-1              | Section 2      |
| PdfTemplate for certificates                             | R1-DA-10             | Section 2      |
| ExamSitting for sessions                                 | R1-DA-1              | Section 12     |
| AdminCalendarEvent                                       | R1-DA-1              | Section 14     |
| OJT model correction                                     | R1-DA-1              | Section 9      |
| 3 MCQ options (not 4)                                    | R1-EASA-2            | Section 4      |
| Unified 75% pass threshold                               | R1-EASA-1, R1-EASA-3 | Section 4, 8   |
| KnowledgeLevel distribution                              | R1-EASA-3            | Section 11     |
| TIMED_OUT / VOIDED sessions                              | R1-EASA-5            | Section 12     |
| EASA module code mapping                                 | R1-EASA-9            | Section 4      |
| Removed MessageReaction (doesn't exist)                  | R1-DA-1              | Section 14     |
| Wallet sequence fixed (no negative balance)              | R2-BL-1              | Section 10     |
| TransactionType enum compliance (PAYMENT not DEBIT)      | R2-BL-2              | Section 10     |
| Active session seeded via state machine transition       | R2-BL-3              | Section 12     |
| includesOjt: true on pathway                             | R2-BL-9              | Section 2      |
| Reserve funds for active M3 exam                         | R2-BL-10             | Section 10, 12 |
| BondingContract schema fix                               | R2-DEV-1             | Section 2      |
| InterviewSlot schema fix                                 | R2-DEV-1             | Section 2      |
| ApplicationDocumentType required fields                  | R2-DEV-1             | Section 2      |
| Passkey via direct DB insert                             | R2-DEV-2             | Section 1      |
| Transaction wrapping + prismaUnfiltered                  | R2-DEV-3             | Section 15     |
| Cleanup implementation                                   | R2-DEV-4             | Section 15     |
| Permission pre-seeding                                   | R2-DEV-5             | Section 15     |
| SystemSetting seeds (internal_exam_system_enabled, etc.) | R3-INT-1             | Section 0      |
| Staff test account                                       | R3-INT-9             | Section 1      |
| Bank categoryCode set                                    | R3-INT-10            | Section 11     |
| submittedById on questions                               | R3-INT-3             | Section 11     |
| questionOrder on active session                          | R3-INT-4             | Section 12     |
| InternalExamAnswer records for active session            | R3-INT-2             | Section 12     |
| explanations on questions                                | R3-INT-8             | Section 11     |
| InternalExamViolation records                            | R3-INT-6             | Section 12     |
| InternalExamReport records                               | R3-INT-7             | Section 12     |
| Cron job test data                                       | R3-INT-12, R3-INT-13 | Section 14     |
| Performance: dependency-based batches + createMany       | R3-PERF              | Section 15     |
