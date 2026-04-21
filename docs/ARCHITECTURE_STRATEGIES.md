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
