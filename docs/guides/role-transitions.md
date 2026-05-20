# Role transitions

Aerojet has six user roles in order of authority:

| Role | Portal | Notes |
|---|---|---|
| `SUPER_ADMIN` | `/staff` | Bypasses every permission check. |
| `ADMIN` | `/staff` | Bypasses every permission check. |
| `STAFF` | `/staff` | Needs explicit grants via `/staff/admin/permissions`. |
| `EXAMINER` | `/examiner` | Has `InstructorProfile`; restricted to exam workflows. |
| `INSTRUCTOR` | `/instructor` | Has `InstructorProfile`. |
| `STUDENT` | `/student` | Has `StudentProfile` + wallet. |
| `APPLICANT` | `/applicant` | No profile by default. |

## What happens when you change a role

The wizard at `/staff/users/[id]` → **Change role** runs three steps:

1. **Select** the target role.
2. **Preview** — calls `POST /api/staff/users/[id]/role/preview` (read-only).
   Returns the exact list of side effects the commit step will perform:
   profile creation, wallet creation, email dispatch, audit-log write,
   and any warnings (e.g. abandoned StudentProfile after demotion).
3. **Confirm** — type the user's full name to commit. Calls
   `PATCH /api/staff/users/[id]/role`.

### Profile side effects

| Target role | Profile created if missing | Generated ID |
|---|---|---|
| `STUDENT` | `StudentProfile` (+ `Wallet` if absent) | `AATA-XXXX` |
| `INSTRUCTOR` | `InstructorProfile` | `IN-XXXX` |
| `EXAMINER` | `InstructorProfile` | `EX-XXXX` |
| `STAFF` | `StaffProfile` | `ST-XXXX` |
| `ADMIN` | `StaffProfile` | `AD-XXXX` |
| `APPLICANT` | — | — |

The `XXXX` digits are random 4-digit suffixes with a uniqueness retry loop.

### Email side effects

- `→ STUDENT`: sends "student promotion" email (template
  `sendStudentPromotionEmail`) to `user.personalEmail || user.email`.

### Demotion gotchas

The role change **does not**:

- Delete a previous-role profile. A demoted INSTRUCTOR keeps their
  `InstructorProfile`; a demoted STUDENT keeps their `StudentProfile` and
  wallet balance. Clean up manually if required.
- Revoke `RoleGrant` rows tied to the old role. Visit
  `/staff/admin/permissions` and revoke explicitly.
- Cancel pending enrollments, payments, or referrals owned by the user.

### Permission required

`MANAGE_ROLES` — granted to ADMIN/SUPER_ADMIN by default. Staff users need
an explicit grant via `/staff/admin/permissions`.

### Audit trail

Every commit writes one `AuditLog` row with
`action = UPDATE, entity = User, description = "Changed user role from X to Y"`
and `changes = { previousRole, newRole, generatedStudentId? }`.

## Programmatic usage

```ts
// Read-only preview
await fetch(`/api/staff/users/${id}/role/preview`, {
  method: 'POST',
  body: JSON.stringify({ role: 'STUDENT' }),
})

// Commit
await fetch(`/api/staff/users/${id}/role`, {
  method: 'PATCH',
  body: JSON.stringify({ role: 'STUDENT' }),
})
```
