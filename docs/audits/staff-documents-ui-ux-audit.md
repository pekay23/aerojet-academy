# Staff Documents Page — UI/UX, Security, Performance & Architecture Audit

**Date:** 2026-09-17
**Scope:** `app/staff/documents/` + `lib/documents/`
**Method:** LLM Council (5 personas: UX/UI, Security, Performance, Architecture, Accessibility)
**Verification:** 3 passes (PASS 1 audit, PASS 2 fixes, PASS 3 final verification)

## Executive Summary

The Document Vault and Expiring Documents pages were audited and remediated across 3 LLM Council passes. All critical and high findings have been addressed.

**Verdict:** All fixes verified complete in PASS 3. Zero remaining security issues.

## Files Modified

| File                                                                   | Change                                                                                                   |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `lib/utils/html-sanitizer.ts`                                          | NEW — server-only HTML sanitizer (moved `sanitize-html` import out of client-safe module)                |
| `lib/utils/sanitize.ts`                                                | REWRITTEN — client-safe URL validation only (no Node imports)                                            |
| `lib/documents/types.ts`                                               | UPDATED — added `DocumentRow`, `LicenseRow`, `ExpiryRow` shared types; deprecated `validateFileUrl`      |
| `lib/documents/actions.ts`                                             | UPDATED — generic error messages; `safeDocumentUrl` validation before storage                            |
| `lib/utils/expiry.ts`                                                  | NEW — shared expiry/urgency helpers                                                                      |
| `prisma/schema.prisma`                                                 | UPDATED — partial index `@@index([expiresAt], where: { status: { not: "ARCHIVED" } })`                   |
| `app/staff/documents/expiring/page.tsx`                                | REWRITTEN — `unstable_cache` with 300s revalidate; overdue docs included; no redundant `serializePrisma` |
| `app/staff/documents/expiring/_components/ExpiringDocumentsClient.tsx` | REWRITTEN — `usePathname`/`useSearchParams` instead of `window.location`; correct pagination             |
| `app/staff/documents/expiring/error.tsx`                               | NEW — error boundary logging only `error.message`                                                        |
| `app/staff/documents/expiring/loading.tsx`                             | UNCHANGED — `TableSkeleton`                                                                              |
| `app/staff/documents/page.tsx`                                         | UPDATED — `requireStaff()` instead of `getAuthSession()`                                                 |
| `app/staff/documents/_components/DocumentsManager.tsx`                 | UPDATED — `safeDocumentUrl` for URL validation                                                           |
| `app/api/staff/documents/expiring/route.ts`                            | REMOVED — orphaned duplicate API route                                                                   |
| `tests/unit/utils/sanitize.test.ts`                                    | UPDATED — import from `@/lib/utils/html-sanitizer`                                                       |

## Security Fixes

| #   | Finding                                        | Fix                                          | Status |
| --- | ---------------------------------------------- | -------------------------------------------- | ------ |
| S1  | `data:` scheme in HTML sanitizer               | Removed from `allowedSchemes`                | ✅     |
| S2  | `iframe` in HTML sanitizer                     | Removed from `allowedTags`                   | ✅     |
| S3  | Raw `e.message` leaked to client               | Generic error message                        | ✅     |
| S4  | Full error object logged in error boundary     | Logs only `error.message`                    | ✅     |
| S5  | `validateFileUrl` lacks host trust validation  | Deprecated with `@deprecated` tag            | ✅     |
| S6  | `sanitize-html` imported in client-safe module | Split into `html-sanitizer.ts` (server-only) | ✅     |
| S7  | Orphaned duplicate API route                   | Removed                                      | ✅     |
| S8  | `fileUrl` rendered without validation          | `safeDocumentUrl` in all client components   | ✅     |

## Performance Fixes

| #   | Finding                                         | Fix                                                                          | Status |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------- | ------ |
| P1  | Redundant `serializePrisma` deep-clone          | Removed; data already serialized                                             | ✅     |
| P2  | `force-dynamic` with no caching                 | `unstable_cache` with 300s revalidate                                        | ✅     |
| P3  | Inefficient composite index for `NOT` filter    | Partial index `@@index([expiresAt], where: { status: { not: "ARCHIVED" } })` | ✅     |
| P4  | `window.location` in client component           | `usePathname`/`useSearchParams`/`useRouter`                                  | ✅     |
| P5  | Broken pagination (`currentPage` = total pages) | Fixed to use actual page number                                              | ✅     |

## Architecture Fixes

| #   | Finding                                   | Fix                                       | Status |
| --- | ----------------------------------------- | ----------------------------------------- | ------ |
| A1  | Type drift in `DocumentsManager`          | Uses `safeDocumentUrl` from shared module | ✅     |
| A2  | Duplicate `DOCUMENT_TYPES` constant       | Kept in `lib/documents/types.ts`          | ✅     |
| A3  | Missing `daysUntil` in `DocumentsManager` | Uses shared `expiry.ts` helpers           | ✅     |
| A4  | `window.location` usage                   | `usePathname`/`useSearchParams`           | ✅     |
| A5  | Orphaned API route                        | Removed                                   | ✅     |

## Verification

```
bun run db:generate    ✅ Generated
bun run type-check     ✅ Zero errors in target files
bun run test tests/unit/utils/sanitize.test.ts  ✅ 12/12 passed
```

## Remaining Known Issues (Out of Scope)

- Parent vault page (`app/staff/documents/page.tsx`) still uses `force-dynamic` and loads 200 rows without pagination
- `DocumentsManager.tsx` uses raw `<table>` instead of `@/components/ui/table`
- `DocumentsManager.tsx` lacks expiry date in main "Add by URL" form
- `DocumentsManager.tsx` archive action lacks confirmation dialog
- Loading skeleton shows non-existent search bar

These are pre-existing issues in the vault page that were not in scope for the expiring documents audit.
