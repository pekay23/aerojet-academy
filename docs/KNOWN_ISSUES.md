# Known Issues & Pending Fixes

This document tracks persistent issues and bugs that are not yet fully resolved.

## 🖼️ Logo Aspect Ratio & CSS Warnings
**Problem**: The AATA Logo triggers hydration or layout warnings in `not-found.tsx`, `loading.tsx`, and `(auth)/layout.tsx`.
- **Symptoms**: Console warnings about width/height, and occasional "flicker" or stretching on slow loads.
- **Root Cause**: The Next.js `Image` component's `width`/`height` props combined with `style={{ width: 'auto', height: 'auto' }}` can be temperamental if the container isn't explicitly sized.
- **Current Status**: Partially mitigated via `h-auto w-[180px]` classes, but a permanent fix requires standardizing a `Logo` component across all layout entry points.

## 🐢 Dashboard Analytics Latency
**Problem**: Initial load of `/staff/reports` is slow (up to 75s in dev).
- **Cause**: Simultaneous execution of ~20 complex database queries against a remote Neon instance.
- **Impact**: Frustrating developer experience and potential production timeouts for large datasets.
- **Planned Fix**: Implement database indexes on all `status` and `date` columns.
- **Current Status**: Partially mitigated. Chart components lazy-loaded via `next/dynamic`. Prisma transaction timeouts increased to 30s. Indices applied to `AuditLog` and `ExamBooking` tables. Chart `width(-1) height(-1)` warnings resolved (v1.4.0).

## ✉️ Email Verification Delays
**Problem**: Some users report delays in receiving the `verifyToken` email.
- **Cause**: Rate limiting on the SMTP provider or background worker queuing.
- **Current Status**: Under investigation. Developers should check the `AuditLog` for `EMAIL_SENT` status to verify the system attempted delivery.

## 📄 UploadThing Feedback
**Problem**: The file picker sometimes resets or doesn't show a clear "Uploaded" state until the user interacts with the form.
- **Status**: Improved by adding state-driven success checkmarks, but could benefit from a more robust "Upload in Progress" UI.

## 🧩 Prisma Enums vs DB Enums
**Problem**: Occasional mismatches between Prisma-defined enums and existing database enums.
- **Fix Strategy**: Use the `migrate_enums.js` script to manually synchronize enums if `prisma migrate dev` fails.

## 🔗 Database Connection Safety
**Problem**: Cold starts or high concurrent traffic can lead to Prisma connection timeouts.
- **Symptoms**: `P2028: Transaction API error: Transaction already closed` or generic timeout errors during payment/booking.
- **Status**: Mitigated by increasing `$transaction` timeout to 30s and implementing robust error handling in `chargeWallet` and `joinPool` services.

## ⚠️ Database Adapter — DO NOT switch to @prisma/adapter-neon
**Problem**: Commit b0b5e73 switched from `@prisma/adapter-pg` to `@prisma/adapter-neon` + `ws`, which broke all Vercel runtime DB connections.
- **Root Cause**: The `ws` WebSocket module does not work in Vercel's Turbopack serverless bundles. The Neon serverless adapter is designed for edge/Cloudflare Workers environments, not Node.js serverless.
- **Resolution**: Reverted to `@prisma/adapter-pg` with standard `pg` Pool in commit 6ed1cd9.
- **Rule**: Always use `@prisma/adapter-pg` for production. Test any adapter changes against a live Vercel deployment before merging.

## Local Development Neon TCP Timeouts
**Problem**: On some local networks, `pg` TCP connections to Neon can hang until the connection timeout even when the Neon HTTP/WebSocket driver works and Vercel remains healthy.
- **Resolution**: `next dev` dynamically uses the Neon WebSocket Prisma adapter for `*.neon.tech` URLs, while production keeps `@prisma/adapter-pg`.
- **Rule**: Keep this as a development-only exception. Do not import/configure `ws` for Vercel runtime, and use `AEROJET_LOCAL_DB_ADAPTER=pg` if local testing specifically needs the standard `pg` adapter.

## 🛡️ Missing Error Boundaries
**Problem**: The (auth) route segment has no `error.tsx`, and (auth)/(portal) have no `not-found.tsx`.
- **Impact**: Auth flow errors show raw Next.js error pages instead of branded error UI.
- **Status**: P2 backlog item in structural review.

## ⚡ Client/Server Import Boundary
**Problem**: `@/lib/analytics/metrics` re-exports `formatCurrency` but imports `prisma`, creating a transitive server dependency. Client components importing from this module will fail with `Can't resolve 'async_hooks'`.
- **Rule**: Client components must import `formatCurrency` from `@/lib/currency` (client-safe), never from `@/lib/analytics/metrics`.
- **Status**: Resolved in v1.4.0 for `ReportsPanel.tsx`. Pattern documented here to prevent recurrence.
