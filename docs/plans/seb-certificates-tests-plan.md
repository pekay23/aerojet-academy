# Tests Plan for SEB & Certificates

## Objective
Add comprehensive test coverage for the SEB config system and certificate generation.

## Test Categories

### 1. SEB Config Unit Tests
**File:** `tests/unit/lib/seb-config.test.ts`

```ts
describe('generateBekPair', () => {
  test('generates valid BEK pair with correct lengths', () => {
    const pair = generateBekPair()
    expect(pair.publicKey).toHaveLength(64) // 32 bytes hex
    expect(pair.privateKey).toHaveLength(128) // 64 bytes hex
    expect(pair.configKey).toHaveLength(32) // 16 bytes hex
  })
})

describe('verifySebRequestHash', () => {
  test('returns true for valid hash', () => {
    const pair = generateBekPair()
    const hash = verifySebRequestHash('expected', pair, 'url', 3600)
    // ... test hash verification logic
  })
})

describe('generateSebConfig', () => {
  test('generates valid ZIP with config.json', () => {
    const zip = generateSebConfig({...})
    // Verify ZIP structure
  })
})
```

### 2. SEB API Integration Tests
**File:** `tests/integration/api/seb-config.test.ts`

```ts
describe('GET /api/staff/exams/internal/sessions/[id]/seb-config', () => {
  test('returns .seb file for valid session with SEB required', async () => {
    // Setup: create bank, class schedule with sebRequired=true, session
    // Request: GET /api/staff/exams/internal/sessions/[id]/seb-config?sessionId=xxx
    // Assert: 200, Content-Type: application/octet-stream, .seb file
  })

  test('returns 403 when SEB not required', async () => {
    // Setup: class schedule with sebRequired=false
    // Assert: 403
  })
})
```

### 3. SEB Validation Middleware Tests
**File:** `tests/unit/lib/seb-validation.test.ts`

```ts
describe('validateSebRequest', () => {
  test('passes for valid SEB request', () => {})
  test('fails for missing header', () => {})
  test('fails for invalid hash', () => {})
})
```

### 4. Certificate Generation Unit Tests
**File:** `tests/unit/lib/certificates/generator.test.ts`

```ts
describe('generateCertificate', () => {
  test('renders template with correct variables', () => {})
  test('generates valid PDF', () => {})
  test('stores PDF in Supabase', () => {})
})
```

### 5. Certificate API Tests
**File:** `tests/integration/api/certificates.test.ts`

```ts
describe('POST /api/certificates', () => {
  test('creates certificate when enabled', async () => {})
  test('returns 403 when disabled', async () => {})
})

describe('GET /api/certificates/verify/[id]', () => {
  test('returns certificate details', async () => {})
})
```

### 6. E2E Tests
**File:** `tests/e2e/seb-certificates.spec.ts`

```ts
test('staff can download SEB config', async ({ page }) => {})
test('student sees download button when SEB required', async ({ page }) => {})
test('certificate is generated after exam submission', async ({ page }) => {})
```

## Test Data Setup
- Seed helper in `tests/helpers/seb-fixtures.ts`
- Mock Supabase storage for certificate tests
- Mock PDF generation for unit tests

## Commands
```bash
# Run SEB tests
bun run test --run tests/unit/lib/seb-config.test.ts
bun run test --run tests/integration/api/seb-config.test.ts

# Run certificate tests
bun run test --run tests/unit/lib/certificates/
bun run test --run tests/integration/api/certificates.test.ts

# Run E2E
bun run test:e2e tests/e2e/seb-certificates.spec.ts
```
