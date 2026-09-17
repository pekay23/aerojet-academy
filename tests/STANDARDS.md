# Aerojet Academy Testing Standards

This document defines the mandatory testing standards for the aerojet-academy project.
All new tests and test modifications must comply with these standards.

---

## 1. Mock Lifecycle

### Rule: Use `vi.resetAllMocks()` in `beforeEach`

`vi.resetAllMocks()` clears call history AND resets mock implementations to their factory defaults.
`vi.clearAllMocks()` only clears call history — implementations persist across tests, causing state leakage.

```ts
// CORRECT
beforeEach(() => {
  vi.resetAllMocks()
})

// WRONG — preserves mockResolvedValue / mockRejectedValue into next test
beforeEach(() => {
  vi.clearAllMocks()
})
```

### Rule: Restore `global.fetch` in component tests

When a test assigns `global.fetch = vi.fn(...)`, always restore the original in `afterEach`:

```ts
const originalFetch = global.fetch

afterEach(() => {
  vi.resetAllMocks()
  global.fetch = originalFetch
})
```

### Rule: Re-apply mock implementations after `resetAllMocks()`

If a test needs a specific mock behavior (e.g., `mockRejectedValueOnce`), set it AFTER `resetAllMocks()`:

```ts
beforeEach(() => {
  vi.resetAllMocks()
  ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
})

it('returns 401 when unauthenticated', async () => {
  ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
  // ...
})
```

---

## 2. Auth Assertions

### Rule: Assert exact status codes, not ranges

Never use `expect([401, 403]).toContain(res.status)` — it masks which guard fired and passes whether auth returns 401 or 403.

```ts
// CORRECT
expect(res.status).toBe(401)

// WRONG — hides whether the route returned 401 or 403
expect([401, 403]).toContain(res.status)
```

### Rule: Test both unauthenticated (401) and permission-denied (403) paths

Every protected route must have:
1. A test mocking `requirePermission` (or equivalent) to throw `'Unauthorized'` → assert 401
2. A test mocking `requirePermission` to throw `'Permission denied: X'` → assert 403

```ts
it('returns 401 when unauthenticated', async () => {
  ;(requirePermission as any).mockRejectedValueOnce(new Error('Unauthorized'))
  const res = await POST(req, { params: { id: '1' } })
  expect(res.status).toBe(401)
})

it('returns 403 when permission denied', async () => {
  ;(requirePermission as any).mockRejectedValueOnce(new Error('Permission denied: MANAGE_EXAMS'))
  const res = await POST(req, { params: { id: '1' } })
  expect(res.status).toBe(403)
})
```

---

## 3. Response Body Assertions

### Rule: Assert response body shape, not just status codes

Integration tests must verify the response payload, not just that the status is 200:

```ts
// CORRECT
const res = await GET(req)
expect(res.status).toBe(200)
const json = await res.json()
expect(json).toHaveProperty('data')
expect(json.data).toHaveLength(2)
expect(json.data[0]).toHaveProperty('id')

// WRONG — passes even if response body is empty or malformed
const res = await GET(req)
expect(res.status).toBe(200)
expect(await res.json()).toBeDefined()
```

---

## 4. Mock Data Completeness

### Rule: Provide all required fields for mocked Prisma models

When mocking `findUnique` / `findFirst` returns, include all fields the route handler accesses:

```ts
// WRONG — route crashes when accessing .entries
prismaMock.oJTLogbook.findUnique.mockResolvedValue({ id: '1' })

// CORRECT
prismaMock.oJTLogbook.findUnique.mockResolvedValue({ id: '1', entries: [] })
```

### Rule: Provide Date fields as real Date objects

Routes that call `.toISOString()` or compare dates will crash if the mock returns `undefined`:

```ts
// WRONG
prismaMock.examPool.findMany.mockResolvedValue([{ id: '1' }])

// CORRECT
prismaMock.examPool.findMany.mockResolvedValue([
  { id: '1', examDate: new Date(), examStartTime: new Date(), examEndTime: new Date() }
])
```

---

## 5. Mock Return Types

### Rule: Match the actual function signature

Mocks must return the same type the real function returns:

```ts
// WRONG — real function returns boolean, not { success: true }
vi.mock('@/lib/internal-exam/engine', () => ({
  isInternalExamSystemEnabled: vi.fn().mockResolvedValue({ success: true })
}))

// CORRECT
vi.mock('@/lib/internal-exam/engine', () => ({
  isInternalExamSystemEnabled: vi.fn().mockResolvedValue(true)
}))
```

---

## 6. Route Handler Testing

### Rule: Pass `params` for dynamic routes

Next.js 16 dynamic route handlers receive `params` as an async argument. Always pass it:

```ts
// CORRECT
const res = await GET(req, { params: { id: '1' } } as any)

// WRONG — ctx.params is undefined, route returns 400/404
const res = await GET(req)
```

### Rule: Use the correct model for mocks

Mock the same model the route handler queries:

```ts
// WRONG — route queries programmeUpgradeRequest, not user
prismaMock.user.findUnique.mockResolvedValueOnce(null)

// CORRECT
prismaMock.programmeUpgradeRequest.findUnique.mockResolvedValueOnce(null)
```

---

## 7. Shared Mock Setup

### Rule: Use shared mock configuration exports from `tests/setup.tsx`

Instead of copy-pasting 15+ lines of `vi.mock()` blocks, import the shared defaults:

```ts
import { authHelpersMockDefaults, apiResponseMockDefaults } from '@/tests/setup'

vi.mock('@/lib/auth/helpers', () => ({
  ...authHelpersMockDefaults,
  requireStaff: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
}))

vi.mock('@/lib/api/response', () => ({
  ...apiResponseMockDefaults,
}))
```

---

## 8. File Naming & Organization

### Rule: Test files mirror the source structure

```
app/api/staff/newsroom/route.ts        → tests/integration/api/staff-newsroom.test.ts
app/api/student/ojt/route.ts           → tests/integration/api/student-ojt.test.ts
lib/auth/permissions.ts                → tests/unit/lib/auth-permissions.test.ts
components/shared/DataTable.tsx        → tests/components/shared/DataTable.test.tsx
app/staff/actions.ts                   → tests/integration/actions/staff-actions.test.ts
```

---

## 9. Test Naming

### Rule: Use descriptive test names that document behavior

```ts
// CORRECT
it('returns 403 when permission denied for MANAGE_EXAMS')
it('returns 404 when programme year not found')
it('allows staff to access staff-scoped images')

// WRONG
it('works')
it('returns correct status')
it('test 1')
```

---

## 10. Pre-Commit Checklist

Before committing test changes, verify:

- [ ] No `clearAllMocks()` — use `resetAllMocks()`
- [ ] No `expect([401, 403]).toContain(res.status)` — use exact status codes
- [ ] No `expect([400, 404]).toContain(res.status)` — use exact status codes
- [ ] All mocked Prisma returns include required fields (dates, relations)
- [ ] Mock return types match real function signatures
- [ ] Dynamic route tests pass `{ params: { id: '...' } }` to handlers
- [ ] Component tests restore `global.fetch` in `afterEach`
- [ ] Response body shape is asserted, not just status code
- [ ] New tests use shared mock exports from `tests/setup.tsx`

---

## 11. Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Unit tests (lib/) | 80%+ | ✅ |
| Component tests | Key components | ✅ |
| Integration API tests | All routes | ✅ |
| Server actions | Top 3 risk files | ✅ |
| Proxy/auth middleware | All paths | ✅ |

---

*Last updated: 2026-08-28*
*Maintained by: Aerojet Academy Engineering*
