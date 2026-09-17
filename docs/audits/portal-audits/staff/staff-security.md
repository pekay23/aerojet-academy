# Staff Portal — Security & Auth Audit

Date: 2026-08-27
Auditor: Security Auditor Agent

## Executive Summary

The Staff portal is built on solid foundations — a role-aware `requireStaff`/`requireAdmin`/`requirePermission` guard system, broad Zod input validation, pervasive `server-only` usage, parameterized Prisma queries, and extensive audit logging on privileged mutations. However, two systemic weaknesses undermine this: (1) the documented edge-proxy auth layer (`ROUTE_ROLE_MAP`) is **not implemented** in `proxy.ts`, leaving per-handler checks as the only gate, and (2) a meaningful subset of `/api/staff/*` GET routes authenticate the session but **never enforce a staff role**, exposing cross-user PII and financial data to any logged-in user (including students). Audit logging, secrets handling, and SQL-injection resistance are in good shape.

## Findings

### Category: Auth Guards / Role Validation

#### Finding 1 — Edge proxy does not gate `/staff/*` or `/api/staff/*` (ROUTE_ROLE_MAP absent)
- **File**: `proxy.ts`
- **Lines**: 14-46 (handler only handles `/api/images/*` and image files), 123-130 (matcher only covers `/api/images/:path*` and image extensions)
- **Severity**: High
- **Type**: Bug
- **Description**: CLAUDE.md documents an active edge proxy that gates `/staff`, `/instructor`, `/student`, `/examiner`, `/applicant` and their `/api/*` siblings via a `ROUTE_ROLE_MAP`. The actual `proxy.ts` (renamed from `middleware.ts`) does **not** contain a `ROUTE_ROLE_MAP` and its `config.matcher` does **not** match `/staff/*` or `/api/staff/*` at all. There is no global edge-level authentication/authorization or security-header injection for staff pages and APIs. Protection relies entirely on individual route handlers and the page `layout.tsx`. This is a single point of failure: any handler that forgets or weakens its check (see Finding 2) is fully exposed, and there is no defense-in-depth or global rate limiting at the edge.
- **Recommendation**: Either restore the documented edge proxy (add a `matcher` for `/staff/:path*` and `/api/staff/:path*` plus a `ROUTE_ROLE_MAP` that returns `401`/redirects for unauthenticated and `403`/redirect for wrong-role users), or formally document that the edge proxy is images-only and that **every** `/api/staff/*` route MUST call a role guard (and add a test/lint to enforce it). Apply global security headers at the proxy or `next.config.ts` `headers()` for all routes, not just image responses.
- **Code Reference**:
  ```ts
  export const config = {
    matcher: [
      '/api/images/:path*',
      '/((?!_next/static|_next/image|favicon.ico).*\\..*webp|...)' // image files only
    ],
  }
  ```

#### Finding 2 — GET APIs authenticate but do not enforce a staff role (Broken Access Control)
- **File**: `app/api/staff/payments/route.ts`, `app/api/staff/students/route.ts`, `app/api/staff/finance/overview/route.ts`, `app/api/staff/applicants/route.ts`, `app/api/staff/users/counts/route.ts` (and several analytics/email/passkey GET routes)
- **Lines**:
  - `payments/route.ts:6-8`
  - `students/route.ts:6-8`
  - `finance/overview/route.ts:5-7`
  - `applicants/route.ts:6-8`
  - `users/counts/route.ts:39-41`
- **Severity**: High
- **Type**: Bug
- **Description**: These handlers call `getAuthSession()` and return 401 only when there is **no** session, but never verify `session.user.role` belongs to the staff allow-list. Because the edge proxy (Finding 1) does not gate `/api/staff/*`, any authenticated principal — including `STUDENT`, `APPLICANT`, or `INSTRUCTOR` — can call these endpoints and read data outside their entitlement:
  - `/api/staff/payments` returns **all users' payment records** (emails, amounts, reference codes).
  - `/api/staff/students` returns **all student PII plus wallet balances**.
  - `/api/staff/finance/overview` returns aggregate financial data.
  - `/api/staff/applicants` returns applicant PII.
  This is inconsistent with correctly-hardened siblings that *do* enforce a role (e.g. `topbar-items/route.ts:9-11`, `classrooms/route.ts:13-15` (POST), `users/route.ts:7-11`, `finance/reports/route.ts:19`).
- **Recommendation**: Enforce a staff role allow-list (`['SUPER_ADMIN','ADMIN','STAFF','EXAMINER']` where appropriate) in every `/api/staff/*` route, ideally via a shared wrapper (e.g. `requireStaff()` / `withStaffHandler`) rather than ad-hoc `if (!session)` checks. Apply the same allow-list used in `app/staff/layout.tsx:20` for staff-only data.
- **Code Reference** (`payments/route.ts`):
  ```ts
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // ❌ no role check → any authenticated user can read all payments
  ```

### Category: Input Validation

#### Finding 3 — Missing upper bound on pagination `limit` in list endpoints (resource exhaustion)
- **File**: `app/api/staff/users/route.ts`, `app/api/staff/students/route.ts`
- **Lines**: `users/route.ts:17-18`, `students/route.ts:13-14`
- **Severity**: Low
- **Type**: Improvement
- **Description**: These list endpoints parse `limit`/`page` directly with `parseInt(...)` and pass them straight into Prisma `take`/`skip` without clamping the maximum. A caller can request `?limit=100000000`, causing a very large query/response. `lib/api/response.ts` already provides `parsePagination()` which clamps `limit` to 100 (line 138), but these routes inline their own unclamped parsing. Notably `payments/route.ts:14` *does* clamp (`Math.min(parseInt(...||'50'), 100)`), so the pattern is inconsistent.
- **Recommendation**: Use `parsePagination(searchParams)` from `lib/api/response.ts` consistently across all list endpoints, or otherwise clamp `limit` to a sane maximum (e.g. 100) and validate `page`.
- **Code Reference** (`users/route.ts`):
  ```ts
  const limit = parseInt(searchParams.get('limit') || '25')   // ❌ no upper bound
  ...
  take: limit,
  ```

### Category: XSS / SQLi

#### Finding 4 — Permissive HTML sanitizer used for `dangerouslySetInnerHTML` (stored XSS / content injection)
- **File**: `lib/utils/sanitize.ts`; used in `app/staff/newsroom/create/page.tsx`, `app/staff/newsroom/[id]/edit/page.tsx`, `app/staff/newsroom/_components/NewsMarkdownEditor.tsx`
- **Lines**: `lib/utils/sanitize.ts:7-35`; `create/page.tsx:207-209`; `edit/page.tsx:285-287`; `NewsMarkdownEditor.tsx:623`
- **Severity**: Medium
- **Type**: Improvement
- **Description**: All three staff newsroom `dangerouslySetInnerHTML` usages are passed through `sanitizeHtml` (good — content is not rendered raw), but the sanitizer configuration is overly permissive for untrusted/author-generated HTML that is later shown to public readers:
  - `allowedTags` includes `iframe`, `video`, `audio`, `source` (media/embedding elements).
  - `iframe` allows `src` with the `data:` scheme → a `data:`-URI iframe can embed arbitrary HTML/JS in some browsers.
  - `allowedAttributes` grants `style` (and `id`) on **all** elements (`'*': ['class','id','style']`), enabling CSS-based injection/overlay attacks and bypass of layout/clickjacking controls.
  - `allowedSchemes` includes `data` broadly.
  
  A malicious or compromised staff author could embed an `<iframe src="data:...">` or abuse inline `style` to attack readers of the published public article, and the same sanitizer is the sole control for any future rich-HTML surface.
- **Recommendation**: Tighten the allow-list to the minimum required for article rendering — drop `iframe` (or allow only a specific trusted embed domain via `allowedIframeHostnames`), drop `style`/`id` on `'*'`, and remove `data:` from `allowedSchemes` unless strictly needed. Prefer rendering Markdown through a vetted Markdown→HTML pipeline with this sanitizer as a second layer, rather than persisting/rendering raw HTML.
- **Code Reference** (`lib/utils/sanitize.ts`):
  ```ts
  allowedTags: [ ..., 'iframe', 'video', 'audio', 'source', ... ],
  allowedAttributes: { '*': ['class', 'id', 'style'], ... },
  allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
  ```

#### Finding 5 — CSP permits `unsafe-inline` and `unsafe-eval` (weak XSS mitigation)
- **File**: `next.config.ts`
- **Lines**: 68 (`script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com ...`)
- **Severity**: Medium
- **Type**: Improvement
- **Description**: The production CSP in `next.config.ts` includes `'unsafe-inline'` and `'unsafe-eval'` in `script-src`. This defeats the browser's last line of defense against XSS: any script injection (including via Finding 4 or future regressions) will execute unrestricted. `'unsafe-eval'` is rarely required outside dev tooling and specific libraries.
- **Recommendation**: Move to a nonce- or hash-based `script-src` (Next.js supports `next/script` with nonce injection) and remove `'unsafe-eval'` unless a specific dependency genuinely requires it (then scope it to that domain). Keeping a strict CSP provides defense-in-depth behind the sanitizer.

#### SQL Injection — No issues found.
- **Description**: The only raw SQL usages are two `$queryRaw` calls in `app/staff/users/[id]/page.tsx:39` and `app/staff/students/[id]/page.tsx:36` (slug→id resolution) and one static aggregate in `app/api/staff/users/counts/route.ts:9`. All use Prisma **tagged-template** literals, where interpolated values (`${id}`) are auto-parameterized by Prisma; the aggregate query is fully static with no interpolation. All other data access uses the parameterized Prisma client. No string-concatenated or `$queryRawUnsafe` queries were found. This follows the CLAUDE.md "never load all rows to filter / do filtering in SQL via Prisma" convention correctly.

### Category: Secrets

#### No issues found.
- **Description**: `server-only` is correctly imported in all secret-bearing modules: `lib/prisma/client.ts:1`, `lib/prisma/db-base.ts:63`, `lib/env.ts:33`, `lib/auth/auth-options.ts:1`, `lib/audit/logger.ts:1`, `lib/security/rate-limit.ts:1`, `lib/security/csrf.ts:1`, and the entire `lib/email/*`, `lib/gdpr/*`, `lib/storage/*`, `lib/analytics/*` trees — matching the CLAUDE.md "Historical Lessons" requirement. `lib/api/response.ts:123-127` only leaks `error.message` when `NODE_ENV === 'development'`, returning a generic message in production. No secrets were observed imported into client components.

### Category: Rate Limiting

#### Finding 6 — No rate limiting on any `/api/staff/*` route
- **File**: `app/api/staff/**` (all routes)
- **Lines**: N/A (absence)
- **Severity**: Medium
- **Type**: Improvement
- **Description**: `lib/security/rate-limit.ts` (with `server-only` guard) and `checkRateLimit()` in `lib/auth/helpers.ts` exist and are applied to public/auth endpoints — `app/api/auth/resend-verification/route.ts:12`, `app/api/public/register/route.ts:23`, `app/api/public/contact/route.ts:43`, `app/api/public/submit-payment-proof/route.ts:11`, `app/api/unsubscribe/route.ts:11`. A grep for `rateLimit`/`checkRateLimit` across `app/api/staff` returns **zero** matches. Privileged and expensive staff operations — user creation, role changes (`users/[id]/role`), payment approve/reject, bulk user/enrollment/payment updates (`app/staff/actions.ts`), GDPR export & anonymise, referrals fraud-scan, admissions import `execute`, and analytics — have no rate limiting. An authenticated (or session-replaying) actor could brute-force or abuse these endpoints (e.g. enumerate/hammer the un-role-checked list endpoints from Finding 2, or trigger costly bulk jobs).
- **Recommendation**: Apply `rateLimit(key, max, window)` to high-value staff mutations (and the sensitive GET list endpoints), keyed by `session.user.id` and/or `getClientIp(req)`, with sensible per-role/per-endpoint thresholds. Reuse the existing `lib/security/rate-limit.ts` primitive already wired for public endpoints.
- **Code Reference**: (existing pattern to mirror, from `app/api/auth/resend-verification/route.ts:12`)
  ```ts
  const { allowed } = rateLimit(`resend-verify:${ip}`, 3, 60 * 60 * 1000) // 3 per hour per IP
  if (!allowed) return apiTooManyRequests()
  ```

### Category: Audit Logging

#### No issues found.
- **Description**: Privileged mutations consistently write `AuditAction` rows via `createAuditLog` from `lib/audit/logger` (which is `server-only`). Verified coverage includes: role changes (`users/[id]/role/route.ts:120`, with `previousRole`/`newRole` diff), payment approve/reject (`payments/[id]/approve/route.ts:336,389`), wallet top-up approve/reject (`finance/wallet-topups/[id]/approve` and `reject`), refunds and withdrawals, permission grants (`admin/permissions/grants/route.ts:61`), user suspend/restore/reset-password/privacy/resend (`users/[id]/*`), GDPR requests/export/anonymise (`gdpr/*`), certificate/document release (`app/staff/actions.ts:999` `setCertificateRelease`), and exam record create/update/delete (`actions.ts:505,704,749`). The `description`/`changes` field convention (string summary + object diff) matches CLAUDE.md. Note: the audit trail depends on the calling route; the role-less GET endpoints in Finding 2 do not need audit logs (read-only), but their exposure is a separate concern addressed there.

## Appendix
- **Files audited** (representative; full `app/staff` tree reviewed for patterns):
  - `proxy.ts`
  - `next.config.ts`
  - `lib/api/response.ts`
  - `lib/auth/helpers.ts`
  - `lib/prisma/client.ts` (referenced; `server-only` confirmed)
  - `lib/utils/sanitize.ts`, `lib/security/sanitization.ts`
  - `lib/security/rate-limit.ts` (referenced; `server-only` confirmed)
  - `lib/audit/logger.ts` (referenced; `server-only` confirmed)
  - `app/staff/layout.tsx`
  - `app/staff/actions.ts`
  - `app/staff/newsroom/create/page.tsx`, `app/staff/newsroom/[id]/edit/page.tsx`, `app/staff/newsroom/_components/NewsMarkdownEditor.tsx`
  - `app/staff/users/[id]/page.tsx`, `app/staff/students/[id]/page.tsx`
  - `app/api/staff/payments/route.ts`, `payments/[id]/approve/route.ts`
  - `app/api/staff/students/route.ts`, `users/route.ts`, `users/counts/route.ts`, `users/[id]/role/route.ts`
  - `app/api/staff/finance/overview/route.ts`, `finance/reports/route.ts`
  - `app/api/staff/applicants/route.ts`, `topbar-items/route.ts`, `classrooms/route.ts`
  - `app/api/staff/admin/permissions/grants/route.ts`
  - All `app/api/staff/**` route handlers (auth-guard and rate-limit presence scanned via grep)
- **Total findings**: 6
  - Critical: 0
  - High: 2 (Finding 1, Finding 2)
  - Medium: 3 (Finding 4, Finding 5, Finding 6)
  - Low: 1 (Finding 3)
  - No Action Needed: 3 categories (SQL Injection, Secrets, Audit Logging)
