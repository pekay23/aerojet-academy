# GDPR Export Specification — Instructor Analytics CSV

## 1. Overview

This document defines the data-processing rules for the instructor analytics CSV export endpoint:

```
GET /api/instructor/exams/classes/[classId]/analytics?format=csv
```

The endpoint is restricted to authenticated instructors. Exported files contain exam session results and must comply with institutional GDPR obligations.

---

## 2. Access Control

- **Who can export:** Assigned instructor for the class (`requireInstructor` + ownership check).
- **Who cannot export:** Students, applicants, staff without instructor assignment, unauthenticated users.
- **Audit logging:** Every export request should be treated as a data-access event. The instructor portal should log the requesting user ID, class ID, timestamp, and `includePii` flag.

---

## 3. Query Parameters

| Parameter    | Type          | Default | Description                                            |
| ------------ | ------------- | ------- | ------------------------------------------------------ |
| `format`     | string        | `json`  | Set to `csv` to receive a CSV file.                    |
| `includePii` | boolean       | `true`  | When `false`, all personal identifiers are obfuscated. |
| `from`       | ISO 8601 date | —       | Filter sessions submitted on or after this date.       |
| `to`         | ISO 8601 date | —       | Filter sessions submitted on or before this date.      |
| `page`       | integer       | `1`     | JSON response pagination.                              |
| `limit`      | integer       | `20`    | JSON response page size (max 100).                     |

### 3.1 `includePii` (default: `true`)

When `includePii=false`:

| Column       | PII value (includePii=true) | Exported value (includePii=false)        |
| ------------ | --------------------------- | ---------------------------------------- |
| `Student ID` | Prisma user ID (UUID)       | Opaque random ID: `S-XXXXXXXXXX`         |
| `Name`       | `First Last` from profile   | `Student N` where N is 1-based row index |
| `Email`      | Student email address       | Empty string                             |

### 3.2 `maxRangeDays` (cap: 365 days)

When both `from` and `to` are provided, the server computes:

```ts
diffDays = (to - from) / (1000 * 60 * 60 * 24)
```

If `diffDays > 365`, the endpoint returns:

```
HTTP 400
{
  "success": false,
  "error": "Date range exceeds maximum allowed span of 365 days"
}
```

Single-sided filters (`from` only or `to` only) are not capped — they default to the full remaining history.

---

## 4. CSV Column Definitions

The CSV header row is fixed in the following order:

| #   | Column         | Type    | PII | Notes                              |
| --- | -------------- | ------- | --- | ---------------------------------- |
| 1   | `Student ID`   | string  | Yes | Obfuscated when `includePii=false` |
| 2   | `Name`         | string  | Yes | Obfuscated when `includePii=false` |
| 3   | `Email`        | string  | Yes | Empty when `includePii=false`      |
| 4   | `Bank`         | string  | No  | Question bank name                 |
| 5   | `Status`       | string  | No  | `COMPLETED` or `TIMED_OUT`         |
| 6   | `Score`        | integer | No  | Raw score                          |
| 7   | `Total Points` | integer | No  | Maximum possible points            |
| 8   | `Percentage`   | number  | No  | 0–100                              |
| 9   | `Passed`       | boolean | No  | `true`/`false`/empty               |
| 10  | `Started At`   | string  | No  | ISO 8601: `yyyy-MM-dd HH:mm:ss`    |
| 11  | `Submitted At` | string  | No  | ISO 8601: `yyyy-MM-dd HH:mm:ss`    |

### 4.1 Date Format Standardization

All date values use **ISO 8601 compact format with time**:

```
yyyy-MM-dd HH:mm:ss
```

Example: `2026-09-07 14:35:22`

This is consistent with the server-side `formatDateISO()` helper. Dates are rendered in the server timezone (UTC by default; PostgreSQL stores timestamps in UTC).

---

## 5. Row Limits

| Response type        | Limit                                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| JSON (`format=json`) | Paginated: max `limit=100` per page                                     |
| CSV (`format=csv`)   | Hard cap of **1000 rows** enforced server-side via `take: MAX_CSV_ROWS` |

If a class has more than 1000 completed/timed-out sessions, the CSV export returns the most recent 1000 rows ordered by `submittedAt DESC`. The instructor should use date-range filters to narrow results.

---

## 6. PII Inclusion / Exclusion Rules

### 6.1 Inclusion (includePii=true, default)

Full personal identifiers are exported. This is the default because:

- The export is restricted to the assigned instructor.
- Instructors already have direct access to student records through the portal.
- GDPR Article 6(1)(b) / (c) — legitimate interest / legal obligation for exam administration.

### 6.2 Exclusion (includePii=false)

All direct identifiers are replaced:

1. **Student ID** — replaced with a random opaque identifier. No mapping back to the original user ID is retained in the exported file.
2. **Name** — replaced with sequential anonymization (`Student 1`, `Student 2`, …). The order preserves relative ranking (by `submittedAt DESC`) but does not identify individuals.
3. **Email** — replaced with empty string.

Non-PII columns (bank name, status, scores, dates) are **unchanged** — they are necessary for academic analysis.

---

## 7. Retention Policy for Exported Files

| Aspect                        | Policy                                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **On-disk retention**         | No automated retention. CSV files are generated on-demand and streamed to the client. They are not stored server-side.                                                        |
| **Instructor responsibility** | Instructors who download CSV files are responsible for their own local data handling and deletion in line with institutional GDPR policy.                                     |
| **Log retention**             | Export-access audit logs (user ID, class ID, timestamp, PII flag) are retained per the standard audit log retention policy defined in `docs/guides/gdpr-retention-policy.md`. |

---

## 8. Error Responses

| Condition                      | HTTP Status | Body                                                                                   |
| ------------------------------ | ----------- | -------------------------------------------------------------------------------------- |
| Not instructor or not assigned | 403         | `{ "success": false, "error": "..." }`                                                 |
| Date range > 365 days          | 400         | `{ "success": false, "error": "Date range exceeds maximum allowed span of 365 days" }` |
| Internal exams disabled        | 403         | `{ "success": false, "error": "Internal exams are not currently available" }`          |
| Class not found                | 404         | `{ "success": false, "error": "Class not found" }`                                     |

---

## 9. Implementation Notes

- The `obfuscateStudent()` helper generates opaque IDs using `Math.random().toString(36)` — this is non-deterministic across exports. The same student will receive different opaque IDs in different exports. This is intentional: it prevents linkage across exports without a master mapping table.
- The `formatDateISO()` helper enforces consistent date formatting for both the JSON and CSV responses.
- The `MAX_CSV_ROWS` constant (1000) is enforced at the database query level (`take`) rather than post-query slicing, to prevent excessive memory usage.
