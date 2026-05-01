# Known Issues & Pending Fixes

This document tracks persistent issues and bugs that are not yet fully resolved.

## 🖼️ Logo Aspect Ratio & CSS Warnings
**Problem**: The AATA Logo triggers hydration or layout warnings in `not-found.tsx`, `loading.tsx`, and `(auth)/layout.tsx`.
- **Symptoms**: Console warnings about width/height, and occasional "flicker" or stretching on slow loads.
- **Root Cause**: The Next.js `Image` component's `width`/`height` props combined with `style={{ width: 'auto', height: 'auto' }}` can be temperamental if the container isn't explicitly sized.
- **Current Status**: Partially mitigated via `h-auto w-[180px]` classes, but a permanent fix requires standardizing a `Logo` component across all layout entry points.

## 🐢 Dashboard Analytics Latency
**Problem**: Initial load of `/staff/reports` is slow (up to 75s in dev).
- **Cause**: Simultaneous execution of ~20 complex database queries against a remote Supabase instance.
- **Impact**: Frustrating developer experience and potential production timeouts for large datasets.
- **Planned Fix**: Implement database indexes on all `status` and `date` columns.
- **Current Status**: Partially mitigated. Prisma transaction timeouts increased to 30s to handle peak loads. Indices applied to `AuditLog` and `ExamBooking` tables.

## ✉️ Email Verification Delays
**Problem**: Some users report delays in receiving the `verifyToken` email.
- **Cause**: Rate limiting on the SMTP provider or background worker queuing.
- **Current Status**: Under investigation. Developers should check the `AuditLog` for `EMAIL_SENT` status to verify the system attempted delivery.

## 📄 UploadThing Feedback
**Problem**: The file picker sometimes resets or doesn't show a clear "Uploaded" state until the user interacts with the form.
- **Status**: Improved by adding state-driven success checkmarks, but could benefit from a more robust "Upload in Progress" UI.

## 🧩 Prisma Enums vs DB Enums
**Problem**: Occasional mismatches between Prisma-defined enums and existing Supabase DB enums.
- **Fix Strategy**: Use the `migrate_enums.js` script to manually synchronize enums if `prisma migrate dev` fails.

## 🔗 Database Connection Safety
**Problem**: Cold starts or high concurrent traffic can lead to Prisma connection timeouts.
- **Symptoms**: `P2028: Transaction API error: Transaction already closed` or generic timeout errors during payment/booking.
- **Status**: Mitigated by increasing `$transaction` timeout to 30s and implementing robust error handling in `chargeWallet` and `joinPool` services.
