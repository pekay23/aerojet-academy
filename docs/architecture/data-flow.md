# Data Flow

## Registration → Activation
```
User registers (public form)
  → Creates User (APPLICANT, PENDING)
  → Generates registrationCode (AERO-YYYY-XXXXXX)
  → User uploads payment proof
  → Status → PAYMENT_PENDING
  → Staff reviews and approves
  → Generates academyEmail, tempPassword
  → Status → ACTIVE
  → Email sent with credentials
```

## Applicant → Student Promotion
```
Applicant purchases course
  → Creates Enrollment (PENDING) + Payment (PENDING)
  → Staff approves enrollment
  → If role == APPLICANT:
    → Generates studentId (AJA-YYYY-NNNN)
    → Creates StudentProfile + Wallet
    → Role → STUDENT
    → Email sent
```

## Exam Pool Lifecycle
```
Staff creates ExamEvent → creates ExamPools
  → Status: OPEN
  → Students join (€300 reserved per join)
  → At 23 members: NEAR_FULL
  → At 25 members: auto-CONFIRMED (funds captured)
  → Can accept up to 28 members
  → Cron: if <25 at T-21 days → FAILED (funds released)
  → Staff can manually confirm via Go/No-Go
```

## Wallet Operations
```
TOP_UP:    balance += amount
RESERVE:   reservedBalance += amount (available decreases)
CAPTURE:   balance -= amount, reservedBalance -= amount
RELEASE:   reservedBalance -= amount (available increases)
REFUND:    balance += amount
```
