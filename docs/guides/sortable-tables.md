# Sortable table pattern (server-paginated lists)

All list endpoints in the Aerojet codebase follow the same shape: an authenticated page reads `searchParams`, runs a Prisma `findMany` with pagination, and hands the rows to a client table. This pattern is the lowest-risk way to add column sorting to those tables.

## TL;DR

1. Page reads `?sort=<key>&order=<asc|desc>` from `searchParams`.
2. A allow-list of `sortKey → Prisma field path` is declared in the page.
3. `buildOrderBy()` translates the URL params into a Prisma `orderBy` object.
4. Clicking a column header pushes a new URL with `sort`, `order`, and `page=1`.
5. Prisma returns the new order, the table re-renders.

The reusable pieces live in two places:

- `components/ui/sortable-th.tsx` — the **client** primitive. Exports `<SortableTh>` for headers and re-exports `buildOrderBy` for convenience.
- `lib/utils/build-order-by.ts` — the **server-safe** `buildOrderBy` helper. Import from here in server components (page.tsx) to avoid the `'use client'` boundary.

## Files to touch per table

| File | Change |
|---|---|
| `app/<portal>/<page>/page.tsx` | Add `sort` and `order` to `searchParams` type, declare allow-list, call `buildOrderBy`, pass result to Prisma `orderBy` |
| `app/<portal>/<page>/_components/<Table>.tsx` | Replace the static `<TableHead>` with `<SortableTh sortKey="..." label="..." />` |

## Reference: enrollments table

`app/staff/enrollments/page.tsx`:

```tsx
import { buildOrderBy } from '@/lib/utils/build-order-by'

const ALLOWED_SORT_KEYS = {
  student:    'user.profile.lastName',
  course:     'course.name',
  status:     'status',
  enrolledAt: 'enrolledAt',
  amount:     'amountPaid',
} as const

type SortKey = keyof typeof ALLOWED_SORT_KEYS

export default async function EnrollmentsPage({ searchParams }) {
  const params = await searchParams
  // ... pagination as before ...

  const orderBy = buildOrderBy<SortKey>(params, ALLOWED_SORT_KEYS, { createdAt: 'desc' })

  const enrollments = await prismaUnfiltered.enrollment.findMany({
    where,
    orderBy: orderBy as Prisma.EnrollmentOrderByWithRelationInput,
    // ...
  })
}
```

`app/staff/enrollments/_components/EnrollmentsTable.tsx`:

```tsx
import { SortableTh } from '@/components/ui/sortable-th'

// In the TableHeader:
<SortableTh sortKey="student" label="Student" />
<SortableTh sortKey="enrolledAt" label="Enrolled Date" />
<SortableTh sortKey="amount" label="Amount Paid" align="right" />
```

## Security: the allow-list

`buildOrderBy` will only emit an `orderBy` for keys that appear in the `allowed` map. Anything else falls through to `defaultOrderBy`. **Never** pass the raw `params.sort` value directly into Prisma — that lets users sort by any column including related models and computed fields.

## Prisma field path syntax

The allow-list value is a dot path into the Prisma include shape:

| Allow-list value | Prisma `orderBy` |
|---|---|
| `enrolledAt` | `{ enrolledAt: 'asc' }` |
| `user.profile.lastName` | `{ user: { profile: { lastName: 'asc' } } }` |
| `course.name` | `{ course: { name: 'asc' } }` |

`buildOrderBy` builds the nested object for you.

## Sort cycle

Click cycle for a column: `unsorted → asc → desc → unsorted`. In practice the URL cycle is `?sort=<key>&order=asc|desc` (no "off" state — clicking past desc returns to the default `{ createdAt: 'desc' }`).

Pagination is reset to page 1 on every sort change so the user doesn't end up on a stale page from the old order.

## What does NOT use this pattern

- **Client-side small tables** (e.g. pickers, settings lists, sub-panels with < 50 rows) — use `useSort<T>()` from `lib/hooks/useSort.tsx` + `<SortHeader>`.
- **The generic `DataTable` primitive** at `components/shared/DataTable.tsx` — that has its own `sortable` + `onSort` props. New tables that fit the declarative column model should prefer that.
- **Layout-only tables** (pricing, comparison, info rows) — not sortable by design.

## Conversion checklist for each follow-up PR

1. Read the page's `searchParams` and the existing `where` / `orderBy`.
2. List the visible headers that should be sortable — usually all of them.
3. Build the allow-list, mapping each public key to a Prisma field path.
4. Pass `orderBy` to Prisma.
5. Replace the matching `<TableHead>` with `<SortableTh sortKey="..." label="..." />`.
6. Run `bun x tsc --noEmit` to verify the page compiles.
7. Manually click each header to confirm the URL changes, the data re-sorts, and pagination resets to page 1.

## Tables not yet sorted (target for follow-up PRs)

See `docs/audits/2026-08-31-sortable-tables-inventory.md` for the full list of ~47 tables and which ones need server-paginated sort vs client-side sort.
