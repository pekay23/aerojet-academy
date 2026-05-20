# Architecture & Problem Solving Strategies

This document explains the "Why" behind our implementation choices and the strategies used to fix common issues.

## 🎨 Branding Strategy: Aerojet Blue
The project uses a custom branding color `aerojet-blue`. 
- **Tailwind Config**: Defined in `tailwind.config.ts` as `aerojet-blue: '#002855'`.
- **Consistency Rule**: All primary headings, labels, and active UI states in the recruitment and student portals should use `text-aerojet-blue` or `bg-aerojet-blue`.
- **Refactoring Strategy**: We recently moved away from generic `text-blue-900` or `text-slate-900` to this specific brand color to ensure professional consistency across the multi-step forms.

## 📊 Charting: The Recharts "Responsive" Fix
**Problem**: Console warnings saying `The width(-1) and height(-1) of chart should be greater than 0`.
**Cause**: `ResponsiveContainer` tries to calculate its size before its parent DOM element has finished rendering (common with flex/grid and hidden tabs).
**Solution**: 
- Applied `minWidth={1}` and `minHeight={1}` to all `ResponsiveContainer` instances. 
- This ensures the component has a non-zero initial state, silencing the warning and preventing layout shifts during re-calculation.

## 🏎️ Performance: Dashboard Data Fetching
**Problem**: The `/staff/reports` page took 75s to load in development.
**Strategy**:
1.  **Concurrent Execution**: Used `Promise.all` to fetch metrics, top courses, and alerts in parallel.
2.  **Granular Selects**: Updated Prisma queries to only `select` necessary fields instead of fetching entire objects with heavy relations.
3.  **Client-Side Navigation**: Using Next.js `Link` and `tab` query parameters allows switching analytics views without full page reloads, though the initial load remains heavy.
**Next Step**: Implement a caching layer (e.g., `next/cache` with `revalidatePath`) for analytic data that doesn't change by the second.

## 📝 Form Management: Zod + React Hook Form
For complex forms across the portal:
- **Strategy**: Each step has its own validation schema, but they all contribute to a single `formData` state.
- **Problem**: Multi-step forms losing data on "Back" navigation.
- **Solution**: State is lifted to the parent component and synchronized with `localStorage` or a dedicated store to ensure persistence during the session.

## 📁 File Uploads: UploadThing
- **Strategy**: Client-side uploads directly to UploadThing to reduce server load.
- **Problem**: Lack of confirmation/feedback after upload.
- **Fix**: Implemented the `onClientUploadComplete` callback to update a "ready" state and show a success checkmark before the user proceeds to the next step.

## 🪑 Seating Chart System: Dual Storage Pattern
**Problem**: Seating assignments need to support two contexts (classes and exams) with different lifecycles and integrity requirements.
**Strategy**:
1. **Classroom layout** — Stored as a `layout` Json field on `Classroom`. Contains `{ rows, cols, cells: [{ row, col, type, label }] }`. Cell types: `DESK`, `AISLE`, `OBSTACLE`.
2. **Seat records** — `Seat` model with `@@unique([classroomId, row, col])`. Auto-synced from layout: when a layout is saved, all seats are deleted and recreated from desk cells in a single transaction.
3. **Exam seating** — Uses a proper FK: `ExamSittingAssignment.seatId` references `Seat.id`. Provides referential integrity for exam records.
4. **Class seating** — Uses SystemSettings JSON: `class_seating_{classId}` → `{ seatId: userId }`. Chosen to avoid schema migrations for an ephemeral relationship that changes frequently and doesn't need referential integrity.
5. **Student view** — `/student/seating` aggregates both sources and renders `SeatCard` components with mini CSS grid floor plans highlighting the student's assigned seat.

**Why dual storage?** Exam seating needs audit-grade referential integrity (FK). Class seating is informal and changes often — JSON in SystemSettings avoids migration churn and lets staff reassign freely without constraint violations.

## 🔐 Two-Factor Authentication: Error-Based Flow
**Problem**: NextAuth's credentials provider doesn't natively support multi-step authentication (password → TOTP).
**Strategy**:
1. The credentials provider throws a specific error string `'2FA_REQUIRED'` when the user has 2FA enabled but no TOTP code was provided.
2. The `LoginForm` client component catches this error, shows a TOTP input field, and re-authenticates with the `totpCode` parameter included.
3. On the second attempt, the provider verifies the TOTP code against the stored secret using `otplib` v5's `verify()` function.
**Why this approach?** NextAuth doesn't support custom authentication flows or intermediate states. Using the error channel avoids patching NextAuth internals while keeping the flow entirely within the existing `signIn('credentials', ...)` API.

## 🎯 Interactive Floor Plan: CSS Grid + Paint-Drag
**Problem**: Staff need a visual tool to design classroom seating layouts without specialized software.
**Strategy**:
- CSS Grid with `gridTemplateColumns: repeat(cols, minmax(0, 1fr))` for the floor plan.
- Three paint tools: DESK (creates seats), AISLE (walkways), OBSTACLE (pillars, equipment).
- Paint-drag: `onMouseDown` sets tool, `onMouseEnter` applies while dragging. Prevents accidental text selection with `user-select: none`.
- Auto-labels: Desk cells labeled sequentially by row (A1, A2, B1, B2…). Row letter = `String.fromCharCode(65 + rowIndex)`, column number = desk count in that row.
- Grid resize: +/- buttons adjust rows and cols, preserving existing cell data within bounds.
