# Database Schema

## Core Models
- **User** — All portal users (applicant, student, instructor, staff, admin)
- **Profile** — Personal info (name, phone, nationality, address)
- **StudentProfile** — Student-specific (studentId, enrollmentType)
- **InstructorProfile** — Instructor-specific (specialization, license)

## Academic
- **Course** — Training programmes (6 types)
- **Enrollment** — User-course relationships
- **Class** — Scheduled sessions with instructor
- **Grade** — Assessment results
- **AttendanceRecord** — Class attendance tracking

## Exams
- **ExamEvent** — Exam sessions (date range, status, go/no-go)
- **ExamPool** — Candidate pools within events (25-28 members)
- **PoolMembership** — Student-pool join records
- **ExamBooking** — Individual exam bookings
- **ExamResult** — Exam outcomes

## Financial
- **Wallet** — Student e-wallet (balance, reservedBalance)
- **WalletTransaction** — All wallet movements (TOP_UP, RESERVE, PAYMENT, RELEASE)
- **Payment** — Payment records (registration, course, exam, top-up)

## System
- **Notification** — In-app notifications
- **AuditLog** — All system actions
- **FileUpload** — Uploaded files tracking
- **SystemSetting** — Key-value admin-editable settings (registration fees, exam pricing, payment splits, email config)
- **PaymentMethod** — Bank transfer details (account name, number, SWIFT, branch)
