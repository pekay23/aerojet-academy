# Student Data Migration Plan

## Overview
Migrate historical exam and wallet data for 8 students based on manual records. The migration includes:
- Wallet credits
- Exam bookings (past)
- Exam results (pass/fail)
- Admin notes with intended modules
- License category intentions

---

## IMPORTANT MODIFICATIONS (Per User Feedback)
1. **DO NOT assume exam dates** - Leave blank for admin to fill manually
2. **Check existing exam records** in database first - only create new records if they don't exist
3. **For Bernard Bandor**: Add license targets as admin notes ONLY, not in database
4. **Pricing**: Use USD 780 for historical twin pack (current price is EUR 980)
5. **Admin can edit notes** - Fields not entered will be filled manually by admin later

---

## Student Details & Migration Tasks

### 1. David Archer
**Current Status:** Wallet €0, No exams written
**Intended Modules:** M1, M2, M3, M4, M5, M8 (M4 & M5 refunded)

**Tasks:**
- [ ] Find student record in database by name
- [ ] Verify wallet balance is €0
- [ ] Create admin note: "Historical intended modules: M1, M2, M3, M4, M5, M8. M4 and M5 were refunded."
- [ ] Leave exam date fields blank for admin to fill later

---

### 2. Abdul Wahab Adam
**Current Status:** Wallet €1340, No exams written
**Intended Modules:** M1, M2, M3, M8

**Tasks:**
- [ ] Find student record in database by name
- [ ] Verify/update wallet balance to €1340
- [ ] Create wallet transaction: CREDIT €1340 (Admin adjustment - historical credit)
- [ ] Create admin note: "Historical intended modules: M1, M2, M3, M8. Consolidated from earlier records."

---

### 3. Dzator Stanley Korku
**Current Status:** Wallet €670, No exams written
**Intended Modules:** M1, M8

**Tasks:**
- [ ] Find student record in database by name
- [ ] Verify/update wallet balance to €670
- [ ] Create wallet transaction: CREDIT €670 (Admin adjustment - historical credit)
- [ ] Create admin note: "Historical intended modules: M1, M8"

---

### 4. Fred Frimpong Ampeh
**Current Status:** Wallet €670, No exams written
**Intended Modules:** M2, M3

**Tasks:**
- [ ] Find student record in database by name
- [ ] Verify/update wallet balance to €670
- [ ] Create wallet transaction: CREDIT €670 (Admin adjustment - historical credit)
- [ ] Create admin note: "Historical intended modules: M2, M3"

---

### 5. Bernard Bandor
**Current Status:** Wallet £3090 (€3090)
**Intended Modules:** M1, M2, M3, M8
**License Intentions:** B1 & B2

**Tasks:**
- [ ] Find student record in database by name
- [ ] Verify/update wallet balance to €3090 (or £3090 depending on currency)
- [ ] Create wallet transaction: CREDIT €3090 (Admin adjustment - historical credit)
- [ ] **DO NOT add license targets in database**
- [ ] Create admin note: "Historical intended modules: M1, M2, M3, M8. License intentions: B1 & B2 (add as admin notes only)."

---

### 6. Edith Afi Avege
**Current Status:** Wallet €670
**Exam History:**
- Earlier sitting: Twin pack (M8, M10) → Failed both → Used free resit on M10 → Failed resit
- Last sitting: Twin pack (M1, M9) → Passed both
- Intends: M2, M3 as twin booking

**Tasks:**
- [ ] Find student record in database by name
- [ ] **Check existing exam results in database FIRST**
- [ ] If exam results already exist in database, verify they match: M8 (fail), M10 (fail), M1 (pass), M9 (pass)
- [ ] Verify/update wallet balance to €670
- [ ] Create wallet transaction: CREDIT €670 (for future M2, M3 booking)
- [ ] **Exam Booking Records** (only if not already in database):
  - [ ] Twin pack, M8 & M10, earlier sitting - **LEAVE DATE BLANK**
  - [ ] Twin pack, M1 & M9, last sitting - **LEAVE DATE BLANK**
- [ ] **Exam Result Records** (only if not already in database):
  - [ ] M8: FAILED (earlier sitting)
  - [ ] M10: FAILED (first attempt)
  - [ ] M10: FAILED (resit - free resit used)
  - [ ] M1: PASSED
  - [ ] M9: PASSED
- [ ] Create admin note: "Earlier sitting: Twin pack M8+M10, failed both. Free resit used on M10, failed resit. Last sitting: Twin pack M1+M9, passed both. Intended next: M2, M3 twin booking. Wallet €670 reserved for M2,M3."
- [ ] **LEAVE examDate fields BLANK** for admin to fill manually later

---

### 7. Prince Wiafe
**Current Status:** Wallet €0
**Exam History:** Twin pack (M1, M8) → Passed both
**Intended Modules:** M2, M3

**Tasks:**
- [ ] Find student record in database by name
- [ ] **Check existing exam results in database FIRST**
- [ ] If exam results already exist in database, verify they match: M1 (pass), M8 (pass)
- [ ] Verify wallet balance is €0
- [ ] **Exam Booking Records** (only if not already in database):
  - [ ] Twin pack, M1 & M8, last sitting - **LEAVE DATE BLANK**
- [ ] **Exam Result Records** (only if not already in database):
  - [ ] M1: PASSED
  - [ ] M8: PASSED
- [ ] Create admin note: "Last sitting: Twin pack M1+M8, passed both. Intended next: M2, M3. No wallet funds."
- [ ] **LEAVE examDate fields BLANK** for admin to fill manually later

---

### 8. Ebenezer Oduro Kwarteng
**Current Status:** Wallet €0
**Exam History:** Twin pack (M1, M8) → Passed both
**Intended Modules:** M2, M3

**Tasks:**
- [ ] Find student record in database by name
- [ ] **Check existing exam results in database FIRST**
- [ ] If exam results already exist in database, verify they match: M1 (pass), M8 (pass)
- [ ] Verify wallet balance is €0
- [ ] **Exam Booking Records** (only if not already in database):
  - [ ] Twin pack, M1 & M8, last sitting - **LEAVE DATE BLANK**
- [ ] **Exam Result Records** (only if not already in database):
  - [ ] M1: PASSED
  - [ ] M8: PASSED
- [ ] Create admin note: "Last sitting: Twin pack M1+M8, passed both. Intended next: M2, M3. No wallet funds."
- [ ] **LEAVE examDate fields BLANK** for admin to fill manually later

---

## Pricing Notes
- **Historical Twin Pack Price:** USD 780 (use this for past bookings)
- **Current Twin Pack Price:** EUR 980 (do not change)

---

## Implementation Rules
1. **Check first**: Query database for existing exam results before creating new records
2. **Don't duplicate**: Only create records if they don't exist in database
3. **Leave dates blank**: Don't assume exam dates - admin will fill them manually
4. **Verify existing**: If records exist, verify they match the migration data
5. **Admin notes only**: Don't add license targets to database for Bernard - only add as notes

---

## Technical Implementation Steps

### Step 1: Find Student Records
- Search for each student by name in the database using Prisma
- Note their user IDs, student IDs, wallet IDs

### Step 2: Check Existing Exam Records (CRITICAL)
- Query examResults table for each student
- Query examBookings table for each student
- **Only create new records if they don't exist**

### Step 3: Update Wallet Balances
- Use Prisma to update wallet availableBalance
- Create wallet transaction records with type: ADJUSTMENT or CREDIT
- Include admin notes in transaction descriptions

### Step 4: Create Exam Bookings (Only if not exist)
- Create examBooking records for each past exam
- **LEAVE examDate BLANK** - admin will fill manually
- Include: userId, module codes, booking type (TWIN_PACK), status: COMPLETED, amountPaid: 780 (USD)

### Step 5: Create Exam Results (Only if not exist)
- Create examResult records for pass/fail
- **LEAVE examDate BLANK** if creating new records
- Include: userId, examId, score, percentage, passed/fail status

### Step 6: Create Admin Notes
- Add admin notes to student profile
- Include all intended modules and relevant historical information

---

## Approval Required
Please review and approve this plan before implementation.
