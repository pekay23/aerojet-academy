# API Reference

Base URL: `/api`

## Authentication
- `POST /api/auth/[...nextauth]` — NextAuth endpoints (login, session, etc.)

## Public
- `POST /api/public/register` — Register new applicant
- `POST /api/public/contact` — Submit contact form
- `POST /api/public/submit-payment-proof` — Upload payment proof

## Staff (requires STAFF/ADMIN/SUPER_ADMIN role)
- `GET/POST /api/staff/users` — List/create users
- `GET/PUT/DELETE /api/staff/users/[id]` — User CRUD
- `GET /api/staff/applicants` — List applicants
- `POST /api/staff/applicants/[id]/approve` — Approve applicant
- `GET /api/staff/students` — List students
- `GET /api/staff/enrollments` — List enrollments
- `POST /api/staff/enrollments/[id]/approve` — Approve enrollment
- `GET /api/staff/payments/pending` — Pending payments
- `POST /api/staff/payments/[id]/approve` — Approve/reject payment
- `GET/POST /api/staff/courses` — Course CRUD
- `GET/POST /api/staff/classes` — Class CRUD
- `GET/POST /api/staff/exam-events` — Exam event management
- `POST /api/staff/exam-events/[id]/go-no-go` — Go/No-Go decision
- `GET /api/staff/reports/*` — Reports (enrollment, revenue, pools)
- `GET /api/staff/audit-logs` — Audit log viewer
- `GET/PUT /api/staff/settings` — System settings

## Applicant (requires APPLICANT role)
- `GET /api/applicant/dashboard` — Dashboard data
- `GET /api/applicant/courses` — Browse courses
- `POST /api/applicant/courses/[id]/purchase` — Purchase course
- `GET/PATCH /api/applicant/profile` — Profile management
- `POST /api/applicant/upload-payment` — Upload payment proof

## Student (requires STUDENT role)
- `GET /api/student/dashboard` — Full dashboard data
- `GET /api/student/wallet` — Wallet balance
- `POST /api/student/wallet/top-up` — Request top-up
- `GET /api/student/wallet/transactions` — Transaction history
- `GET /api/student/courses` — My courses
- `GET /api/student/exam-pools/available` — Available pools
- `POST /api/student/exam-pools/[id]/join` — Join pool (€300 hold)
- `GET /api/student/grades` — All grades
- `GET /api/student/attendance` — Attendance records
- `GET /api/student/certificates` — Passed exams
- `GET/PATCH /api/student/notifications` — Notifications
- `GET/PATCH /api/student/profile` — Profile
- `POST /api/student/profile/change-password` — Change password

## Instructor (requires INSTRUCTOR role)
- `GET /api/instructor/dashboard` — Dashboard
- `GET /api/instructor/classes` — My classes
- `POST /api/instructor/classes/[id]/attendance` — Take attendance
- `POST /api/instructor/classes/[id]/grades` — Enter grades
- `GET /api/instructor/schedule` — My schedule

## Cron (requires CRON_SECRET)
- `GET /api/cron/check-pools` — Check/fail expired pools
- `GET /api/cron/check-events` — Update event statuses
- `GET /api/cron/send-reminders` — Send exam reminders (T-7, T-1)
