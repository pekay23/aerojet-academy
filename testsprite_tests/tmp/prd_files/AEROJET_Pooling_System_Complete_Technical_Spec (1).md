# AEROJET ACADEMY - EXAM POOLING SYSTEM
## COMPLETE TECHNICAL SPECIFICATION FOR DEVELOPERS

**Version:** 1.0  
**Date:** February 2026  
**Document Type:** Technical Specification & Developer Brief  
**Confidentiality:** Internal Development Use Only  
**Prepared For:** Development Team  
**Approved By:** Aerojet Academy Management

---

## DOCUMENT OVERVIEW

This document provides complete technical specifications for implementing the Exam Pooling System. It includes business rules, database schema, API specifications, algorithms, UI mockups, and deployment guidelines.

**Target Audience:** Software developers, system architects, database administrators, QA engineers

**Prerequisites:** Understanding of web applications, RESTful APIs, relational databases, payment processing

---

## EXECUTIVE SUMMARY

### The Business Problem

Current exam booking system is unpredictable:
- Individual seats expensive (€520) and unreliable
- Candidates can't self-organize into groups
- Events frequently postponed (40% failure rate)
- Need 60+ individual bookings OR 3+ group charters to hit €25k threshold
- High administrative overhead

### The Solution

**Exam Pooling System** enables strangers to form viable exam groups through the portal:
- Join "pools" (exam sittings) at €300/seat (42% savings)
- Each pool needs 25-28 confirmed candidates
- **CRITICAL RULE:** Each candidate takes ONE module per pool
- Each pool supports up to 4 different module codes
- Wallet-based reservation prevents ghost bookings
- Automatic confirmation when threshold reached

### Success Metrics

**Target Outcomes:**
- 3 confirmed pools per event = €30,000 revenue (120% of €25k target)
- 90%+ pool confirmation rate (vs current 40% event confirmation)
- Pool seats become primary booking method (70%+ of all bookings)
- Individual/bundle bookings become bonus revenue

---

## TABLE OF CONTENTS

1. [Core Concepts & Definitions](#1-core-concepts--definitions)
2. [Business Rules & Validation Logic](#2-business-rules--validation-logic)
3. [Database Schema](#3-database-schema)
4. [API Endpoints Specification](#4-api-endpoints-specification)
5. [Wallet & Payment Flow](#5-wallet--payment-flow)
6. [Algorithms & Pseudocode](#6-algorithms--pseudocode)
7. [User Interface Specifications](#7-user-interface-specifications)
8. [Notification System](#8-notification-system)
9. [Testing Requirements](#9-testing-requirements)
10. [Deployment Plan](#10-deployment-plan)
11. [Appendices](#11-appendices)

---

## 1. CORE CONCEPTS & DEFINITIONS

### 1.1 Exam Event Window

**Definition:** A scheduled exam period occurring approximately every 3 months (quarterly).

**Properties:**
- **Name:** Human-readable identifier (e.g., "Jun 2026 Exam Event")
- **Start Date:** First day of exam sessions
- **End Date:** Last day of exam sessions (typically 2-3 days after start)
- **Join Deadline:** Last date candidates can join pools (typically T-45)
- **Payment Deadline (T-21):** Go/No-Go decision point (21 days before start)
- **Min Revenue Target:** Business threshold (defaults to €25,000)
- **Status:** Current state of event

**Status Values:**
- `DRAFT` - Created but not published
- `OPEN` - Published, accepting bookings
- `CONFIRMED` - Will proceed (thresholds met)
- `POSTPONED` - Delayed to next window
- `CANCELLED` - Admin cancelled
- `COMPLETED` - Exams finished

**Example:**
```
Jun 2026 Exam Event
├─ Start: June 23, 2026
├─ End: June 24, 2026
├─ Payment Deadline: June 2, 2026 (T-21)
├─ Target: €25,000
└─ Contains: Pool A, Pool B, Pool C, Pool D
```

### 1.2 Pool (Exam Sitting)

**Definition:** ONE physical exam session at a specific datetime where candidates take exams simultaneously in the same room.

**CRITICAL CONSTRAINT:**  
> **Each candidate takes EXACTLY ONE MODULE per pool.**  
> If a candidate wants to take multiple modules, they must join MULTIPLE different pools in different time slots.

**Properties:**
- **Event ID:** Parent event reference
- **Name/Label:** Display name (e.g., "Pool A", "Monday Morning Session")
- **Exam Date:** Specific date (e.g., June 23, 2026)
- **Exam Start Time:** Session start (e.g., 09:00)
- **Exam End Time:** Session end (e.g., 12:00)
- **Min Candidates:** Threshold for confirmation (fixed at 25)
- **Max Candidates:** Capacity limit (fixed at 28)
- **Module Diversity Cap:** Maximum distinct modules (fixed at 4)
- **Status:** Current state
- **Pre-Seed Modules:** Optional initial module set (0-4 modules)

**Status Lifecycle:**
```
DRAFT 
  ↓ (admin publishes)
OPEN 
  ↓ (reaches 23-24 candidates)
NEAR_FULL 
  ↓ (reaches 25 candidates)
CONFIRMED 
  ↓ (reaches 28 or T-21 passes)
LOCKED 
  ↓ (exam occurs)
COMPLETED

Alternative path:
OPEN → (T-21 with <25 candidates) → FAILED
```

**Real-World Example:**
```
Pool A - Monday 23 Jun 2026, 9:00 AM
Status: CONFIRMED (27/27 candidates)
Modules: M1, M7, M8, M15

Breakdown:
  8 candidates → taking M1 (Mathematics)
  7 candidates → taking M7 (Maintenance Practices)
  6 candidates → taking M8 (Basic Aerodynamics)
  6 candidates → taking M15 (Gas Turbine Engine)

Total: 27 exam seats (NOT 108!)
Revenue: 27 × €300 = €8,100
```

### 1.3 Module Diversity Cap

**Rule:** Each pool supports a maximum of 4 distinct EASA Part-66 module codes.

**Rationale:**
1. **Examiner Operational Limit:** Examiner can only manage 4 different exam papers per sitting
2. **Logistics:** Exam materials, answer sheets, and invigilation procedures become unmanageable beyond 4
3. **Quality Control:** More modules = higher risk of administrative errors

**Validation Logic:**
```javascript
Current Pool State: [M1, M7, M8]  (3 modules)

Candidate A wants to join with M15:
  → Current: 3, After: 4
  → Result: ✓ ALLOWED (would be 4th module)

Candidate B wants to join with M1:
  → M1 already in pool
  → Result: ✓ ALLOWED (not adding new module)

Current Pool State: [M1, M7, M8, M15]  (4 modules - AT CAP)

Candidate C wants to join with M10:
  → Current: 4, After: 5
  → Result: ✗ REJECTED (would exceed cap)
  → Message: "Pool already has 4 modules. Please select from M1, M7, M8, or M15."

Candidate D wants to join with M8:
  → M8 already in pool
  → Result: ✓ ALLOWED (not adding new module)
```

### 1.4 Candidate Wallet

**Definition:** Virtual prepaid account for exam bookings.

**Balance Components:**
- **Available Balance:** Funds ready to use for new bookings
- **Reserved Balance:** Funds held for pending pool confirmations
- **Total Balance = Available + Reserved**

**Example States:**
```
State 1: Fresh wallet
  Available: €500
  Reserved: €0
  Total: €500

State 2: Joined 2 pools (pending)
  Available: €500 - €600 = -€100 (insufficient)
  → Cannot join without top-up

State 2 (corrected): After top-up
  Available: €100
  Reserved: €600 (Pool A: €300, Pool B: €300)
  Total: €700

State 3: Pool A confirms, Pool B still pending
  Available: €100
  Reserved: €300 (Pool B only)
  Total: €400 (€300 was captured for Pool A)
```

**Transaction Types:**
1. **TOP_UP:** Add funds from payment gateway → increases Available
2. **RESERVE:** Join pool → decreases Available, increases Reserved
3. **CAPTURE:** Pool confirms → decreases Reserved, creates booking
4. **RELEASE:** Pool fails → decreases Reserved, increases Available
5. **REFUND:** Admin action → increases Available
6. **ADJUSTMENT:** Admin correction → increases or decreases Available

### 1.5 Pool Membership

**Definition:** A candidate's enrollment record in a specific pool.

**Properties:**
- **Membership ID:** Unique identifier
- **Pool ID:** Which pool they joined
- **Candidate ID:** Who joined
- **Module Code:** Which module they're taking (e.g., "M1")
- **Status:** Current state of membership
- **Price Paid:** Amount charged (€300, €270 with discount)
- **Reserved Amount:** Held in wallet (matches price_paid if RESERVED)
- **Discount Type:** Applied discount (AMBASSADOR, MULTI_POOL, or null)
- **Referral Code:** If joined via Ambassador link
- **Created At:** When they joined
- **Confirmation Date:** When pool confirmed (null if still pending)

**Status Transitions:**
```
RESERVED 
  → CONFIRMED (pool reaches 25, funds captured)
  → CANCELLED (candidate withdraws before confirmation)
  → FAILED (pool cancelled by system/admin)
  → ROLLED (event postponed, booking moves to next event)

CONFIRMED
  → COMPLETED (exam finished)
  → NO_SHOW (candidate didn't attend)
  → CANCELLED (admin cancellation with refund)
```

---

## 2. BUSINESS RULES & VALIDATION LOGIC

### RULE 001: Module Diversity Cap Enforcement

```python
def can_add_module_to_pool(pool, requested_module):
    """
    Validates if candidate can add their module to the pool.
    
    Returns: (can_add: bool, message: str)
    """
    # Get current unique modules in pool
    current_modules = pool.get_unique_modules()
    # Example: ['M1', 'M7', 'M8']
    
    # Check 1: Module already exists in pool
    if requested_module in current_modules:
        return True, f"{requested_module} already available in this pool"
    
    # Check 2: Would adding exceed cap?
    if len(current_modules) >= 4:
        available = ", ".join(current_modules)
        return False, f"Pool already has 4 modules (maximum). Please choose from: {available}"
    
    # Check 3: Pool still has room
    return True, f"Can add {requested_module} as new module (slot {len(current_modules) + 1}/4)"

# Usage Example
pool = Pool.get(id=101)
can_add, message = can_add_module_to_pool(pool, 'M15')
if can_add:
    proceed_with_join()
else:
    show_error(message)
```

### RULE 002: Pool Capacity Validation

```python
def can_join_pool_capacity(pool):
    """
    Checks if pool has available slots.
    
    Returns: (can_join: bool, message: str)
    """
    confirmed_count = pool.count_confirmed_members()
    
    if confirmed_count >= pool.max_candidates:
        return False, f"Pool full ({pool.max_candidates}/{pool.max_candidates})"
    
    slots_remaining = pool.max_candidates - confirmed_count
    return True, f"{slots_remaining} slots remaining"

# Example
pool_a = Pool.get(id=101)
can_join, msg = can_join_pool_capacity(pool_a)
# → (True, "5 slots remaining") if pool has 23/28
```

### RULE 003: Wallet Sufficient Balance

```python
def has_sufficient_wallet_balance(candidate, required_amount):
    """
    Validates candidate wallet has enough available funds.
    
    Returns: (sufficient: bool, message: str)
    """
    wallet = candidate.get_wallet()
    
    if wallet.available_balance < required_amount:
        shortage = required_amount - wallet.available_balance
        return False, f"Insufficient funds. Need €{required_amount:.2f}, have €{wallet.available_balance:.2f}. Top up €{shortage:.2f}"
    
    return True, f"Sufficient balance (€{wallet.available_balance:.2f} available)"

# Example
candidate = Candidate.get(id=1234)
sufficient, msg = has_sufficient_wallet_balance(candidate, 300.00)
if not sufficient:
    show_topup_prompt(msg)
```

### RULE 004: Datetime Conflict Detection (Multi-Pool)

```python
def check_datetime_conflicts(candidate, new_pool):
    """
    Prevents candidate from joining overlapping pools.
    
    Returns: (has_conflict: bool, conflicting_pool: Pool or None)
    """
    # Get candidate's active pool memberships
    active_pools = candidate.get_active_pool_memberships()
    
    for membership in active_pools:
        existing_pool = membership.pool
        
        # Same date?
        if existing_pool.exam_date == new_pool.exam_date:
            # Check time overlap
            if times_overlap(existing_pool, new_pool):
                return True, existing_pool
    
    return False, None

def times_overlap(pool_a, pool_b):
    """
    Checks if two pools have overlapping exam times.
    """
    # Pool A ends before Pool B starts? No overlap
    if pool_a.exam_end_time <= pool_b.exam_start_time:
        return False
    
    # Pool B ends before Pool A starts? No overlap
    if pool_b.exam_end_time <= pool_a.exam_start_time:
        return False
    
    # Otherwise they overlap
    return True

# Example
candidate = Candidate.get(id=1234)
pool_b = Pool.get(id=102)  # Mon 2PM-5PM

has_conflict, conflicting = check_datetime_conflicts(candidate, pool_b)
if has_conflict:
    show_error(f"Time conflict with {conflicting.name} ({conflicting.exam_start_time})")
```

### RULE 005: Automatic Pool Confirmation

```python
def check_and_trigger_pool_confirmation(pool):
    """
    Automatically confirms pool when it reaches 25 candidates.
    Called after every new join.
    
    Returns: (confirmed: bool, message: str)
    """
    if pool.status not in ['OPEN', 'NEAR_FULL']:
        return False, "Pool already confirmed or closed"
    
    confirmed_count = pool.count_confirmed_members()
    
    if confirmed_count >= 25:
        # Trigger confirmation workflow
        trigger_pool_confirmation(pool)
        return True, f"Pool automatically confirmed with {confirmed_count} candidates"
    
    elif confirmed_count >= 23:
        # Update to near full status
        pool.status = 'NEAR_FULL'
        pool.save()
        return False, f"Pool near full ({confirmed_count}/25)"
    
    return False, f"Pool still needs {25 - confirmed_count} more candidates"

# Usage (called after membership creation)
new_membership = create_pool_membership(candidate, pool, module, price)
confirmed, msg = check_and_trigger_pool_confirmation(pool)
if confirmed:
    log_event('POOL_AUTO_CONFIRMED', pool.id, msg)
    send_confirmation_emails(pool)
```

### RULE 006: Pricing Calculation

```python
def calculate_pool_seat_price(candidate, event):
    """
    Determines price based on discounts.
    Discounts do NOT stack - only best one applies.
    
    Returns: (price: Decimal, discount_type: str or None)
    """
    BASE_PRICE = Decimal('300.00')
    DISCOUNTED_PRICE = Decimal('270.00')
    
    # Priority 1: Check Ambassador status
    if candidate.is_ambassador:
        return DISCOUNTED_PRICE, 'AMBASSADOR'
    
    # Priority 2: Check multi-pool discount
    # Count CONFIRMED pools in this event (not just reserved)
    confirmed_pools = candidate.count_confirmed_pools_in_event(event)
    
    # If they already have 2 confirmed, this would be their 3rd → discount
    # If they have 3+ confirmed, all future pools in event get discount
    if confirmed_pools >= 2:
        return DISCOUNTED_PRICE, 'MULTI_POOL'
    
    # Standard pricing
    return BASE_PRICE, None

# Example Usage
candidate = Candidate.get(id=1234)
event = Event.get(id=5)
price, discount = calculate_pool_seat_price(candidate, event)

print(f"Price: €{price}")
if discount:
    print(f"Discount: {discount} (save €30)")
```

### RULE 007: Event Go/No-Go Decision (T-21)

```python
def evaluate_event_go_nogo(event):
    """
    Determines if event should proceed based on revenue thresholds.
    Called at T-21 (payment deadline).
    
    Returns: (decision: str, reason: str, revenue: Decimal)
    """
    # Get confirmed pools (status = CONFIRMED)
    confirmed_pools = event.get_pools(status='CONFIRMED')
    confirmed_pool_count = len(confirmed_pools)
    
    # Get individual/bundle bookings (not pool-based)
    individual_bookings = event.get_individual_bookings()
    individual_count = len(individual_bookings)
    
    # Get total confirmed seats across ALL booking types
    total_seats = (
        sum(pool.confirmed_count for pool in confirmed_pools) +
        individual_count
    )
    
    # Calculate revenue
    pool_revenue = sum(pool.calculate_revenue() for pool in confirmed_pools)
    individual_revenue = sum(b.amount_paid for b in individual_bookings)
    total_revenue = pool_revenue + individual_revenue
    
    # Threshold A: 3+ confirmed pools (€30k guaranteed minimum)
    if confirmed_pool_count >= 3:
        return 'CONFIRMED', f'Threshold A: {confirmed_pool_count} pools confirmed', total_revenue
    
    # Threshold B: 2 pools + 15 individual/bundle seats (€27.8k+ expected)
    if confirmed_pool_count >= 2 and individual_count >= 15:
        return 'CONFIRMED', f'Threshold B: {confirmed_pool_count} pools + {individual_count} individual seats', total_revenue
    
    # Threshold C: 60+ total confirmed seats (€25.2k+ expected)
    if total_seats >= 60:
        return 'CONFIRMED', f'Threshold C: {total_seats} total seats', total_revenue
    
    # Did not meet any threshold
    return 'POSTPONED', f'No threshold met ({confirmed_pool_count} pools, {total_seats} total seats)', total_revenue

# Usage in T-21 cron job
def run_t21_processor():
    events_at_deadline = Event.get_at_payment_deadline(today())
    
    for event in events_at_deadline:
        decision, reason, revenue = evaluate_event_go_nogo(event)
        
        log_info(f"Event {event.id}: {decision} - {reason} - €{revenue}")
        
        if decision == 'CONFIRMED':
            confirm_event(event)
        else:
            postpone_event(event)
```

### RULE 008: Pool Merge Validation

```python
def can_merge_pools(pool_a, pool_b):
    """
    Validates if two pools can be merged.
    
    Returns: (compatible: bool, reason: str)
    """
    # Check 1: Same event
    if pool_a.event_id != pool_b.event_id:
        return False, "Pools must be in the same event"
    
    # Check 2: Valid statuses (not already confirmed)
    if pool_a.status not in ['OPEN', 'NEAR_FULL']:
        return False, f"Pool A is {pool_a.status} (must be OPEN or NEAR_FULL)"
    
    if pool_b.status not in ['OPEN', 'NEAR_FULL']:
        return False, f"Pool B is {pool_b.status} (must be OPEN or NEAR_FULL)"
    
    # Check 3: Combined capacity
    combined_count = pool_a.confirmed_count + pool_b.confirmed_count
    if combined_count > 28:
        return False, f"Combined count ({combined_count}) exceeds maximum capacity (28)"
    
    # Check 4: Module diversity
    modules_a = set(pool_a.get_unique_modules())
    modules_b = set(pool_b.get_unique_modules())
    combined_modules = modules_a | modules_b
    
    if len(combined_modules) > 4:
        return False, f"Combined modules ({', '.join(combined_modules)}) exceeds cap of 4"
    
    # Check 5: Datetime conflicts (pools can't run simultaneously)
    if pools_overlap(pool_a, pool_b):
        return False, f"Pools have overlapping exam times"
    
    # All checks passed
    return True, f"Compatible: {combined_count} candidates, {len(combined_modules)} modules"

# Example
pool_c = Pool.get(id=103)  # 12 candidates, [M1, M2, M8]
pool_d = Pool.get(id=104)  # 11 candidates, [M3, M5]

compatible, reason = can_merge_pools(pool_c, pool_d)
if compatible:
    print(f"✓ Can merge: {reason}")
    # → "Compatible: 23 candidates, 5 modules"
    # WAIT! 5 modules exceeds cap!
else:
    print(f"✗ Cannot merge: {reason}")
    # → "Combined modules (M1, M2, M3, M5, M8) exceeds cap of 4"
```

### RULE 009: Ambassador Qualification

```python
def check_ambassador_qualification(candidate):
    """
    Determines if candidate qualifies for Ambassador status.
    Requires 10+ successful referrals.
    
    Returns: (qualified: bool, current_count: int)
    """
    # Get successful referrals (referee's pool confirmed)
    successful_referrals = candidate.get_successful_referrals()
    count = len(successful_referrals)
    
    if count >= 10 and not candidate.is_ambassador:
        # Grant Ambassador status
        candidate.is_ambassador = True
        candidate.save()
        
        # Grant one-time wallet credit
        credit_wallet(candidate, Decimal('200.00'), 
                     reason='Ambassador Program - 10 successful referrals')
        
        # Send congratulations email
        send_ambassador_welcome_email(candidate)
        
        return True, count
    
    return candidate.is_ambassador, count

# Usage (called when referee's pool confirms)
def on_pool_confirmed(pool):
    # Check all referrers whose referees are in this pool
    for membership in pool.memberships:
        if membership.referral_code:
            referrer = get_referrer_by_code(membership.referral_code)
            
            # Update successful referral count
            referrer.successful_referrals += 1
            referrer.save()
            
            # Check if now qualifies
            qualified, count = check_ambassador_qualification(referrer)
            if qualified:
                log_event('AMBASSADOR_QUALIFIED', referrer.id, f'{count} referrals')
```

---

## 3. DATABASE SCHEMA

### 3.1 Events Table

```sql
CREATE TABLE events (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Basic Info
    name VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Deadlines
    join_deadline DATE,  -- Optional, typically T-45
    payment_deadline DATE NOT NULL,  -- T-21, critical for go/no-go
    
    -- Business Rules
    min_revenue_target DECIMAL(10,2) DEFAULT 25000.00,
    
    -- Status
    status VARCHAR(20) DEFAULT 'DRAFT',
    -- Possible values: DRAFT, OPEN, CONFIRMED, POSTPONED, CANCELLED, COMPLETED
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by BIGINT,  -- Admin user ID
    
    -- Constraints
    CONSTRAINT valid_event_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_payment_deadline CHECK (payment_deadline <= start_date),
    CONSTRAINT positive_revenue_target CHECK (min_revenue_target > 0)
);

-- Indexes for performance
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_events_payment_deadline ON events(payment_deadline);
```

### 3.2 Pools Table

```sql
CREATE TABLE pools (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Relationships
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Basic Info
    name VARCHAR(200) NOT NULL,  -- "Pool A", "Monday Morning"
    
    -- Schedule
    exam_date DATE NOT NULL,
    exam_start_time TIME NOT NULL,
    exam_end_time TIME NOT NULL,
    
    -- Capacity Rules
    min_candidates INTEGER DEFAULT 25,
    max_candidates INTEGER DEFAULT 28,
    module_diversity_cap INTEGER DEFAULT 4,
    
    -- Status
    status VARCHAR(20) DEFAULT 'DRAFT',
    -- Possible values: DRAFT, OPEN, NEAR_FULL, CONFIRMED, LOCKED, FAILED, MERGED, COMPLETED
    
    -- Pre-seeding
    pre_seed_modules VARCHAR(100)[],  -- Array of module codes, e.g., {'M1', 'M7', 'M8', 'M15'}
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by BIGINT,
    
    -- Constraints
    CONSTRAINT valid_pool_capacity CHECK (max_candidates >= min_candidates),
    CONSTRAINT valid_exam_times CHECK (exam_end_time > exam_start_time),
    CONSTRAINT valid_module_cap CHECK (module_diversity_cap = 4)  -- Fixed at 4
);

-- Indexes
CREATE INDEX idx_pools_event ON pools(event_id);
CREATE INDEX idx_pools_status ON pools(status);
CREATE INDEX idx_pools_datetime ON pools(exam_date, exam_start_time);
CREATE INDEX idx_pools_date_status ON pools(exam_date, status);

-- Partial index for active pools only
CREATE INDEX idx_pools_active ON pools(event_id, status) 
WHERE status IN ('OPEN', 'NEAR_FULL', 'CONFIRMED');
```

### 3.3 Pool Memberships Table

```sql
CREATE TABLE pool_memberships (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Relationships
    pool_id BIGINT NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    candidate_id BIGINT NOT NULL REFERENCES candidates(id),
    
    -- Module Selection
    module_code VARCHAR(10) NOT NULL,  -- e.g., 'M1', 'M7', 'M8'
    
    -- Status
    status VARCHAR(20) DEFAULT 'RESERVED',
    -- Possible values: RESERVED, CONFIRMED, CANCELLED, FAILED, ROLLED, COMPLETED, NO_SHOW
    
    -- Pricing
    price_paid DECIMAL(10,2) NOT NULL,  -- What they're paying (€300 or €270)
    reserved_amount DECIMAL(10,2),  -- Held in wallet (same as price_paid if RESERVED)
    discount_type VARCHAR(50),  -- 'MULTI_POOL', 'AMBASSADOR', or NULL
    
    -- Referral Tracking
    referral_code VARCHAR(50),  -- If joined via Ambassador link
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    confirmation_date TIMESTAMP,  -- When pool confirmed
    
    -- Constraints
    UNIQUE (pool_id, candidate_id),  -- One membership per candidate per pool
    CONSTRAINT valid_membership_price CHECK (price_paid >= 0),
    CONSTRAINT valid_reserved_amount CHECK (reserved_amount >= 0)
);

-- Indexes
CREATE INDEX idx_memberships_pool ON pool_memberships(pool_id);
CREATE INDEX idx_memberships_candidate ON pool_memberships(candidate_id);
CREATE INDEX idx_memberships_status ON pool_memberships(status);
CREATE INDEX idx_memberships_module ON pool_memberships(module_code);
CREATE INDEX idx_memberships_candidate_status ON pool_memberships(candidate_id, status);

-- Partial index for active memberships
CREATE INDEX idx_memberships_active ON pool_memberships(pool_id, status)
WHERE status IN ('RESERVED', 'CONFIRMED');
```

### 3.4 Wallets Table

```sql
CREATE TABLE wallets (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Relationship (one wallet per candidate)
    candidate_id BIGINT NOT NULL UNIQUE REFERENCES candidates(id),
    
    -- Balance Components
    available_balance DECIMAL(10,2) DEFAULT 0.00,  -- Free to use
    reserved_balance DECIMAL(10,2) DEFAULT 0.00,   -- Held for pending pools
    
    -- Currency
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints (prevent negative balances)
    CONSTRAINT positive_available_balance CHECK (available_balance >= 0),
    CONSTRAINT positive_reserved_balance CHECK (reserved_balance >= 0)
);

-- Indexes
CREATE INDEX idx_wallets_candidate ON wallets(candidate_id);

-- For finding candidates with low balance (optional)
CREATE INDEX idx_wallets_available ON wallets(available_balance);
```

### 3.5 Wallet Transactions Table

```sql
CREATE TABLE wallet_transactions (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Relationship
    wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    
    -- Transaction Type
    transaction_type VARCHAR(20) NOT NULL,
    -- Values: TOP_UP, RESERVE, CAPTURE, RELEASE, REFUND, ADJUSTMENT
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    
    -- Balance Snapshots (for audit trail)
    available_before DECIMAL(10,2),
    available_after DECIMAL(10,2),
    reserved_before DECIMAL(10,2),
    reserved_after DECIMAL(10,2),
    
    -- Reference (what this transaction relates to)
    reference_type VARCHAR(50),  -- 'pool_membership', 'booking', 'payment', 'manual'
    reference_id BIGINT,
    
    -- Description
    description TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),  -- 'system', 'admin:user_id', 'payment_gateway'
    
    -- Constraints
    CONSTRAINT valid_transaction_amount CHECK (amount != 0)
);

-- Indexes
CREATE INDEX idx_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX idx_transactions_created ON wallet_transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON wallet_transactions(reference_type, reference_id);

-- For reconciliation queries
CREATE INDEX idx_transactions_wallet_created ON wallet_transactions(wallet_id, created_at DESC);
```

### 3.6 Bookings Table

```sql
CREATE TABLE bookings (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Relationships
    candidate_id BIGINT NOT NULL REFERENCES candidates(id),
    event_id BIGINT NOT NULL REFERENCES events(id),
    pool_id BIGINT REFERENCES pools(id),  -- NULL for non-pool bookings
    
    -- Booking Details
    module_code VARCHAR(10) NOT NULL,
    booking_type VARCHAR(20) DEFAULT 'POOL',
    -- Values: POOL, INDIVIDUAL, BUNDLE, GROUP_CHARTER
    
    -- Payment
    amount_paid DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    -- Values: CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
    
    -- Timestamps
    booking_date TIMESTAMP DEFAULT NOW(),
    exam_date DATE,
    
    -- Constraints
    CONSTRAINT positive_booking_amount CHECK (amount_paid > 0)
);

-- Indexes
CREATE INDEX idx_bookings_candidate ON bookings(candidate_id);
CREATE INDEX idx_bookings_event ON bookings(event_id);
CREATE INDEX idx_bookings_pool ON bookings(pool_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_exam_date ON bookings(exam_date);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_candidate_event ON bookings(candidate_id, event_id);
CREATE INDEX idx_bookings_event_status ON bookings(event_id, status);
```

### 3.7 Referrals Table (Ambassador Program)

```sql
CREATE TABLE referrals (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Relationships
    referrer_candidate_id BIGINT NOT NULL REFERENCES candidates(id),
    referee_candidate_id BIGINT NOT NULL REFERENCES candidates(id),
    
    -- Referral Tracking
    referral_code VARCHAR(50) NOT NULL,  -- Unique code belonging to referrer
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',
    -- Values: PENDING (referee joined), CONFIRMED (referee's pool confirmed), FAILED (pool failed)
    
    -- Reference to the pool membership that was created via referral
    pool_membership_id BIGINT REFERENCES pool_memberships(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),  -- When referee joined using code
    confirmed_at TIMESTAMP,  -- When referee's pool confirmed
    
    -- Constraints
    CONSTRAINT different_candidates CHECK (referrer_candidate_id != referee_candidate_id),
    UNIQUE (referral_code, referee_candidate_id)  -- Can't use same referral twice
);

-- Indexes
CREATE INDEX idx_referrals_referrer ON referrals(referrer_candidate_id);
CREATE INDEX idx_referrals_referee ON referrals(referee_candidate_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
```

### 3.8 Candidates Table Extensions

```sql
-- Assuming candidates table already exists, add these columns:

ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS is_ambassador BOOLEAN DEFAULT FALSE;

ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;

ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS successful_referrals INTEGER DEFAULT 0;

-- Index for finding ambassadors
CREATE INDEX idx_candidates_ambassador ON candidates(is_ambassador) WHERE is_ambassador = TRUE;

-- Update referral code generation function
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        -- Generate unique code: AERO-{first4letters}-{random}
        NEW.referral_code := 'AERO-' || 
                            UPPER(SUBSTRING(NEW.first_name, 1, 4)) || 
                            '-' || 
                            LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_referral_code
BEFORE INSERT ON candidates
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code();
```

### 3.9 Modules Reference Table

```sql
CREATE TABLE modules (
    -- Primary Key
    code VARCHAR(10) PRIMARY KEY,  -- 'M1', 'M7', etc.
    
    -- Details
    name VARCHAR(200) NOT NULL,  -- 'Mathematics', 'Maintenance Practices'
    category VARCHAR(50),  -- 'Category A', 'Category B1', etc.
    
    -- Exam Metadata
    duration_minutes INTEGER DEFAULT 180,  -- Standard 3 hours
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed data for EASA Part-66 modules
INSERT INTO modules (code, name, category, duration_minutes) VALUES
('M1', 'Mathematics', 'Foundation', 180),
('M2', 'Physics', 'Foundation', 180),
('M3', 'Electrical Fundamentals', 'Foundation', 180),
('M4', 'Electronic Fundamentals', 'Foundation', 180),
('M5', 'Digital Techniques / Electronic Instrument Systems', 'Foundation', 180),
('M6', 'Materials and Hardware', 'Foundation', 180),
('M7', 'Maintenance Practices', 'Foundation', 180),
('M8', 'Basic Aerodynamics', 'Foundation', 180),
('M9', 'Human Factors', 'Foundation', 180),
('M10', 'Aviation Legislation', 'Foundation', 180),
('M11', 'Turbine Aeroplane Aerodynamics, Structures and Systems', 'Airframe', 180),
('M13', 'Aircraft Aerodynamics, Structures and Systems', 'Powerplant', 180),
('M15', 'Gas Turbine Engine', 'Powerplant', 180),
('M17', 'Propeller', 'Powerplant', 180);
```

### 3.10 Useful Database Views

```sql
-- ============================================
-- VIEW: Pool Status Summary
-- Real-time pool stats with calculated fields
-- ============================================
CREATE OR REPLACE VIEW pool_status_summary AS
SELECT 
    p.id AS pool_id,
    p.event_id,
    p.name AS pool_name,
    p.exam_date,
    p.exam_start_time,
    p.status,
    p.min_candidates,
    p.max_candidates,
    
    -- Confirmed count
    COUNT(pm.id) FILTER (WHERE pm.status IN ('RESERVED', 'CONFIRMED')) AS confirmed_count,
    
    -- Slots remaining
    p.max_candidates - COUNT(pm.id) FILTER (WHERE pm.status IN ('RESERVED', 'CONFIRMED')) AS slots_remaining,
    
    -- Current modules
    ARRAY_AGG(DISTINCT pm.module_code ORDER BY pm.module_code) 
        FILTER (WHERE pm.status IN ('RESERVED', 'CONFIRMED')) AS current_modules,
    
    -- Module count
    COUNT(DISTINCT pm.module_code) 
        FILTER (WHERE pm.status IN ('RESERVED', 'CONFIRMED')) AS module_count,
    
    -- Can add new module?
    (COUNT(DISTINCT pm.module_code) FILTER (WHERE pm.status IN ('RESERVED', 'CONFIRMED')) < 4) AS can_add_module,
    
    -- Revenue
    SUM(pm.reserved_amount) FILTER (WHERE pm.status = 'RESERVED') AS total_reserved,
    SUM(pm.price_paid) FILTER (WHERE pm.status = 'CONFIRMED') AS total_captured

FROM pools p
LEFT JOIN pool_memberships pm ON p.id = pm.pool_id
GROUP BY p.id;

-- Usage:
-- SELECT * FROM pool_status_summary WHERE pool_id = 101;


-- ============================================
-- VIEW: Event Revenue Summary
-- Aggregate revenue metrics per event
-- ============================================
CREATE OR REPLACE VIEW event_revenue_summary AS
SELECT 
    e.id AS event_id,
    e.name AS event_name,
    e.status AS event_status,
    e.payment_deadline,
    
    -- Pool stats
    COUNT(DISTINCT p.id) AS total_pools,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'CONFIRMED') AS confirmed_pools,
    
    -- Candidate counts
    COUNT(pm.id) FILTER (WHERE pm.status = 'RESERVED') AS reserved_candidates,
    COUNT(pm.id) FILTER (WHERE pm.status = 'CONFIRMED') AS confirmed_candidates,
    COUNT(pm.id) FILTER (WHERE pm.status IN ('RESERVED', 'CONFIRMED')) AS total_candidates,
    
    -- Revenue
    COALESCE(SUM(pm.reserved_amount) FILTER (WHERE pm.status = 'RESERVED'), 0) AS total_reserved_revenue,
    COALESCE(SUM(pm.price_paid) FILTER (WHERE pm.status = 'CONFIRMED'), 0) AS total_captured_revenue,
    COALESCE(SUM(pm.reserved_amount) FILTER (WHERE pm.status = 'RESERVED'), 0) + 
    COALESCE(SUM(pm.price_paid) FILTER (WHERE pm.status = 'CONFIRMED'), 0) AS total_potential_revenue,
    
    -- Progress toward target
    e.min_revenue_target,
    ROUND((COALESCE(SUM(pm.price_paid) FILTER (WHERE pm.status = 'CONFIRMED'), 0) / e.min_revenue_target) * 100, 2) AS captured_percentage

FROM events e
LEFT JOIN pools p ON e.id = p.event_id
LEFT JOIN pool_memberships pm ON p.id = pm.pool_id
GROUP BY e.id;

-- Usage:
-- SELECT * FROM event_revenue_summary WHERE event_id = 5;


-- ============================================
-- VIEW: Candidate Pool Dashboard
-- What candidates see on their "My Pools" page
-- ============================================
CREATE OR REPLACE VIEW candidate_pool_dashboard AS
SELECT 
    pm.candidate_id,
    pm.id AS membership_id,
    
    -- Pool info
    p.id AS pool_id,
    p.name AS pool_name,
    p.exam_date,
    p.exam_start_time,
    p.exam_end_time,
    p.status AS pool_status,
    
    -- Event info
    e.id AS event_id,
    e.name AS event_name,
    e.payment_deadline,
    
    -- Membership details
    pm.module_code,
    m.name AS module_name,
    pm.status AS membership_status,
    pm.price_paid,
    pm.reserved_amount,
    pm.discount_type,
    pm.created_at,
    pm.confirmation_date,
    
    -- Pool metrics
    pss.confirmed_count,
    pss.slots_remaining,
    pss.current_modules,
    
    -- Actionable flags
    (pm.status = 'RESERVED' AND p.status IN ('OPEN', 'NEAR_FULL')) AS can_withdraw,
    (p.status = 'CONFIRMED' AND pm.status = 'CONFIRMED') AS is_confirmed

FROM pool_memberships pm
JOIN pools p ON pm.pool_id = p.id
JOIN events e ON p.event_id = e.id
JOIN modules m ON pm.module_code = m.code
JOIN pool_status_summary pss ON p.id = pss.pool_id

ORDER BY 
    CASE 
        WHEN p.status IN ('CONFIRMED', 'LOCKED') THEN 1
        WHEN p.status IN ('OPEN', 'NEAR_FULL') THEN 2
        ELSE 3
    END,
    p.exam_date,
    p.exam_start_time;

-- Usage:
-- SELECT * FROM candidate_pool_dashboard WHERE candidate_id = 1234;
```

### 3.11 Database Triggers

```sql
-- ============================================
-- TRIGGER: Update pool status based on membership changes
-- ============================================
CREATE OR REPLACE FUNCTION update_pool_status()
RETURNS TRIGGER AS $$
DECLARE
    confirmed_cnt INTEGER;
    pool_max INTEGER;
    pool_status_current VARCHAR(20);
BEGIN
    -- Get current pool info
    SELECT COUNT(*), p.max_candidates, p.status
    INTO confirmed_cnt, pool_max, pool_status_current
    FROM pool_memberships pm
    JOIN pools p ON pm.pool_id = p.id
    WHERE pm.pool_id = COALESCE(NEW.pool_id, OLD.pool_id)
      AND pm.status IN ('RESERVED', 'CONFIRMED')
    GROUP BY p.max_candidates, p.status;
    
    -- Update pool status based on count
    IF confirmed_cnt >= 25 THEN
        -- Auto-confirm if not already
        IF pool_status_current IN ('OPEN', 'NEAR_FULL') THEN
            UPDATE pools 
            SET status = 'CONFIRMED', updated_at = NOW()
            WHERE id = COALESCE(NEW.pool_id, OLD.pool_id);
        END IF;
    ELSIF confirmed_cnt >= 23 THEN
        -- Mark as near full
        IF pool_status_current = 'OPEN' THEN
            UPDATE pools 
            SET status = 'NEAR_FULL', updated_at = NOW()
            WHERE id = COALESCE(NEW.pool_id, OLD.pool_id);
        END IF;
    END IF;
    
    -- Check if now locked (at max capacity)
    IF confirmed_cnt >= pool_max AND pool_status_current = 'CONFIRMED' THEN
        UPDATE pools 
        SET status = 'LOCKED', updated_at = NOW()
        WHERE id = COALESCE(NEW.pool_id, OLD.pool_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_pool_status
AFTER INSERT OR UPDATE OR DELETE ON pool_memberships
FOR EACH ROW
EXECUTE FUNCTION update_pool_status();


-- ============================================
-- TRIGGER: Auto-update wallet updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_updated
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallet_timestamp();


-- ============================================
-- TRIGGER: Validate wallet balance constraints
-- ============================================
CREATE OR REPLACE FUNCTION validate_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure no negative balances
    IF NEW.available_balance < 0 THEN
        RAISE EXCEPTION 'Cannot have negative available balance: %', NEW.available_balance;
    END IF;
    
    IF NEW.reserved_balance < 0 THEN
        RAISE EXCEPTION 'Cannot have negative reserved balance: %', NEW.reserved_balance;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_wallet_balance
BEFORE INSERT OR UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION validate_wallet_balance();
```

---

## 4. API ENDPOINTS SPECIFICATION

[Document continues with complete API specifications, wallet flows, algorithms, UI mockups, notifications, testing, and deployment plans...]

**[DEVELOPER NOTE: This is a 60+ page comprehensive specification. The complete document continues with sections 4-11 covering:**
- **Section 4:** Complete API endpoint documentation with request/response examples
- **Section 5:** Detailed wallet transaction flows with PostgreSQL transaction examples
- **Section 6:** Step-by-step algorithms and pseudocode for all major operations
- **Section 7:** UI wireframes and screen specifications for both candidate and admin interfaces
- **Section 8:** Complete notification system with email templates and trigger conditions
- **Section 9:** Testing requirements including unit, integration, and load testing scenarios
- **Section 10:** Phased deployment plan with rollback procedures
- **Section 11:** Appendices with glossary, FAQ, and support contacts

**The specification continues in the actual document file...]**

---

## QUICK START FOR DEVELOPERS

### Immediate Next Steps:

1. **Review Database Schema (Section 3)**
   - Create dev database
   - Run schema creation scripts
   - Seed modules table

2. **Implement Core Wallet Functions (Section 5)**
   - Reserve funds
   - Capture funds
   - Release funds
   - Ensure atomic transactions

3. **Build Pool Join API (Section 4)**
   - POST /api/pool-memberships
   - Implement all validation rules
   - Test happy path + error cases

4. **Create Admin Pool Management (Section 4)**
   - Pool CRUD operations
   - Status monitoring dashboard

5. **Implement Auto-Confirmation Logic (Section 6)**
   - Background job to check pools
   - Trigger on 25th candidate

### Critical Implementation Notes:

⚠️ **ONE MODULE PER POOL PER CANDIDATE** - This is the most important rule  
⚠️ **Module Diversity Cap = 4** - Never allow 5th module  
⚠️ **Wallet Transactions Must Be Atomic** - Use database transactions  
⚠️ **Auto-Confirm at 25 Candidates** - Not 24, not 26  

### Questions During Development?

Contact: development@aerojet-academy.com

---

**END OF EXCERPT**

*Complete 60+ page specification available in full document file*
