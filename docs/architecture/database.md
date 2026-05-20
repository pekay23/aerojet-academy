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

## Facilities
- **Classroom** — Physical rooms/labs with `name`, `type`, `capacity`, and `layout` (Json — grid definition with rows, cols, and cell types)
- **Seat** — Individual seats within a classroom. Fields: `row`, `col`, `label` (auto-generated A1, A2, B1…). Unique constraint `@@unique([classroomId, row, col])`. Created/synced automatically when a floor plan layout is saved

## Exams (additions)
- **ExamSittingAssignment** — Links students to exam sittings. `seatId` foreign key (optional) references `Seat` for exam seating assignments

## System
- **Notification** — In-app notifications
- **AuditLog** — All system actions
- **FileUpload** — Uploaded files tracking
- **SystemSetting** — Key-value admin-editable settings (registration fees, exam pricing, payment splits, email config, class seating assignments as `class_seating_{classId}` keys)
- **PaymentMethod** — Bank transfer details (account name, number, SWIFT, branch)

## User (additions)
- `twoFactorSecret` — Encrypted TOTP secret for 2FA (nullable)
- `twoFactorEnabled` — Boolean flag indicating if 2FA is active (default false)
