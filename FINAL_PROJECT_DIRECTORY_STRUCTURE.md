# 🗂️ AEROJET ACADEMY - FINAL PROJECT DIRECTORY STRUCTURE

**Complete File Structure for Production**  
**Optimized for:** Security, Performance, Maintainability, Separation of Concerns

---

```
aerojet-academy/
│
├── .github/                                    # GitHub workflows & actions
│   ├── workflows/
│   │   ├── ci.yml                             # Continuous Integration
│   │   ├── deploy-staging.yml                 # Auto-deploy to staging
│   │   └── deploy-production.yml              # Production deployment
│   └── CODEOWNERS                             # Code ownership
│
├── .husky/                                     # Git hooks
│   ├── pre-commit                             # Run linting before commit
│   └── pre-push                               # Run tests before push
│
├── .vscode/                                    # VS Code settings (optional)
│   ├── settings.json                          # Editor settings
│   ├── extensions.json                        # Recommended extensions
│   └── launch.json                            # Debug configurations
│
├── app/                                        # Next.js 16 App Router
│   │
│   ├── (public)/                              # ✅ PUBLIC WEBSITE (No auth required)
│   │   ├── layout.tsx                         # Public layout with nav/footer
│   │   ├── page.tsx                           # Homepage
│   │   ├── loading.tsx                        # Loading state
│   │   ├── error.tsx                          # Error boundary
│   │   │
│   │   ├── about/
│   │   │   ├── page.tsx                       # About Aerojet Academy
│   │   │   └── accra-mro-project/
│   │   │       └── page.tsx                   # MRO project context
│   │   │
│   │   ├── courses/
│   │   │   ├── page.tsx                       # Courses overview
│   │   │   ├── four-year-b1-b2/
│   │   │   │   └── page.tsx                   # 4-year program details
│   │   │   ├── two-year-b1/
│   │   │   │   └── page.tsx                   # 2-year program details
│   │   │   ├── military-certification/
│   │   │   │   └── page.tsx                   # 12-month industry/military
│   │   │   ├── modular-training/
│   │   │   │   └── page.tsx                   # Modular program
│   │   │   ├── exam-only/
│   │   │   │   └── page.tsx                   # Exam-only pricing
│   │   │   ├── revision-support/
│   │   │   │   └── page.tsx                   # Revision classes
│   │   │   └── module-requirements/
│   │   │       └── page.tsx                   # M1-M17 + pathways
│   │   │
│   │   ├── admissions/
│   │   │   ├── page.tsx                       # How to enroll (4 steps)
│   │   │   ├── entry-requirements/
│   │   │   │   └── page.tsx                   # Entry requirements
│   │   │   ├── fees-and-payment/
│   │   │   │   └── page.tsx                   # Fees & payment rules
│   │   │   └── faq/
│   │   │       └── page.tsx                   # FAQ page
│   │   │
│   │   ├── newsroom/
│   │   │   ├── page.tsx                       # News listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx                   # Individual news post
│   │   │
│   │   ├── contact/
│   │   │   └── page.tsx                       # Contact page
│   │   │
│   │   ├── privacy-policy/
│   │   │   └── page.tsx                       # Privacy policy
│   │   │
│   │   ├── online-application-terms/
│   │   │   └── page.tsx                       # Terms & conditions
│   │   │
│   │   └── _components/                       # Public-specific components
│   │       ├── Hero.tsx
│   │       ├── TrustStrip.tsx
│   │       ├── ProgramCard.tsx
│   │       ├── EnrollmentSteps.tsx
│   │       ├── CourseComparison.tsx
│   │       └── NewsCard.tsx
│   │
│   ├── (auth)/                                # 🔐 AUTHENTICATION (Login/Register)
│   │   ├── layout.tsx                         # Auth layout (centered form)
│   │   │
│   │   ├── login/
│   │   │   ├── page.tsx                       # Login page
│   │   │   └── _components/
│   │   │       └── LoginForm.tsx              # Login form component
│   │   │
│   │   ├── register/
│   │   │   ├── page.tsx                       # Public registration
│   │   │   └── _components/
│   │   │       ├── RegistrationForm.tsx       # Registration form
│   │   │       └── PaymentInstructions.tsx    # Bank details display
│   │   │
│   │   ├── forgot-password/
│   │   │   └── page.tsx                       # Password reset request
│   │   │
│   │   ├── reset-password/
│   │   │   └── page.tsx                       # Password reset form
│   │   │
│   │   └── verify-email/
│   │       └── page.tsx                       # Email verification (if needed)
│   │
│   ├── staff/                                 # 👔 STAFF/ADMIN PORTAL
│   │   ├── layout.tsx                         # Staff layout with sidebar
│   │   ├── page.tsx                           # Staff dashboard
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx                       # Main dashboard
│   │   │
│   │   ├── users/
│   │   │   ├── page.tsx                       # User list (all roles)
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx                   # User details
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx               # Edit user
│   │   │   └── create/
│   │   │       └── page.tsx                   # Create user manually
│   │   │
│   │   ├── applicants/
│   │   │   ├── page.tsx                       # Pending applicants
│   │   │   └── [id]/
│   │   │       └── page.tsx                   # Applicant details + approval
│   │   │
│   │   ├── students/
│   │   │   ├── page.tsx                       # Student list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx                   # Student profile
│   │   │   │   ├── grades/
│   │   │   │   │   └── page.tsx               # Student grades
│   │   │   │   ├── attendance/
│   │   │   │   │   └── page.tsx               # Attendance records
│   │   │   │   └── wallet/
│   │   │   │       └── page.tsx               # Wallet management
│   │   │   └── import/
│   │   │       └── page.tsx                   # Bulk student import (CSV)
│   │   │
│   │   ├── enrollments/
│   │   │   ├── page.tsx                       # All enrollments
│   │   │   ├── pending/
│   │   │   │   └── page.tsx                   # Pending approvals
│   │   │   └── [id]/
│   │   │       └── page.tsx                   # Enrollment details
│   │   │
│   │   ├── payments/
│   │   │   ├── page.tsx                       # Payment queue
│   │   │   ├── pending/
│   │   │   │   └── page.tsx                   # Pending payments
│   │   │   ├── approved/
│   │   │   │   └── page.tsx                   # Approved payments
│   │   │   ├── rejected/
│   │   │   │   └── page.tsx                   # Rejected payments
│   │   │   └── [id]/
│   │   │       └── page.tsx                   # Payment details
│   │   │
│   │   ├── finance/
│   │   │   ├── page.tsx                       # Finance dashboard
│   │   │   ├── wallet-topups/
│   │   │   │   └── page.tsx                   # Pending wallet top-ups
│   │   │   ├── transactions/
│   │   │   │   └── page.tsx                   # All transactions
│   │   │   └── reports/
│   │   │       └── page.tsx                   # Financial reports
│   │   │
│   │   ├── courses/
│   │   │   ├── page.tsx                       # Course list
│   │   │   ├── create/
│   │   │   │   └── page.tsx                   # Create course
│   │   │   └── [id]/
│   │   │       ├── page.tsx                   # Course details
│   │   │       └── edit/
│   │   │           └── page.tsx               # Edit course
│   │   │
│   │   ├── classrooms/
│   │   │   ├── page.tsx                       # Classroom list
│   │   │   └── [id]/
│   │   │       ├── page.tsx                   # Classroom detail + floor plan
│   │   │       ├── loading.tsx
│   │   │       └── _components/
│   │   │           └── FloorPlanDesigner.tsx   # Interactive CSS grid layout builder
│   │   │
│   │   ├── classes/
│   │   │   ├── page.tsx                       # Class schedules
│   │   │   ├── create/
│   │   │   │   └── page.tsx                   # Create class
│   │   │   └── [id]/
│   │   │       ├── page.tsx                   # Class details
│   │   │       ├── roster/
│   │   │       │   └── page.tsx               # Class roster
│   │   │       └── seating/
│   │   │           ├── page.tsx               # Class seating assignment
│   │   │           ├── loading.tsx
│   │   │           └── _components/
│   │   │               └── ClassSeatingAssignment.tsx
│   │   │
│   │   ├── exams/
│   │   │   ├── events/
│   │   │   │   ├── page.tsx                   # Exam events list
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx               # Create exam event
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx               # Event details
│   │   │   │       ├── pools/
│   │   │   │       │   └── page.tsx           # Manage pools
│   │   │   │       └── go-no-go/
│   │   │   │           └── page.tsx           # Go/No-Go decision
│   │   │   │
│   │   │   ├── pools/
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx               # Pool details
│   │   │   │       └── members/
│   │   │   │           └── page.tsx           # Pool members
│   │   │   │
│   │   │   ├── sittings/
│   │   │   │   └── [id]/
│   │   │   │       └── seating/
│   │   │   │           ├── page.tsx           # Exam sitting seating assignment
│   │   │   │           ├── loading.tsx
│   │   │   │           └── _components/
│   │   │   │               └── SeatingAssignment.tsx  # Drag-and-drop seating
│   │   │   │
│   │   │   ├── bookings/
│   │   │   │   └── page.tsx                   # All exam bookings
│   │   │   │
│   │   │   └── results/
│   │   │       ├── page.tsx                   # Exam results
│   │   │       └── upload/
│   │   │           └── page.tsx               # Upload results (CSV)
│   │   │
│   │   ├── instructors/
│   │   │   ├── page.tsx                       # Instructor list
│   │   │   └── [id]/
│   │   │       ├── page.tsx                   # Instructor profile
│   │   │       └── assignments/
│   │   │           └── page.tsx               # Class assignments
│   │   │
│   │   ├── reports/
│   │   │   ├── page.tsx                       # Reports dashboard
│   │   │   ├── enrollment-trends/
│   │   │   │   └── page.tsx                   # Enrollment analytics
│   │   │   ├── revenue/
│   │   │   │   └── page.tsx                   # Revenue reports
│   │   │   ├── pool-analytics/
│   │   │   │   └── page.tsx                   # Pool fill rates
│   │   │   └── attendance/
│   │   │       └── page.tsx                   # Attendance reports
│   │   │
│   │   ├── audit-logs/
│   │   │   └── page.tsx                       # Audit log viewer
│   │   │
│   │   ├── settings/
│   │   │   ├── page.tsx                       # System settings
│   │   │   ├── general/
│   │   │   │   └── page.tsx                   # General settings
│   │   │   ├── bank-details/
│   │   │   │   └── page.tsx                   # Bank account settings
│   │   │   ├── email/
│   │   │   │   └── page.tsx                   # Email configuration
│   │   │   └── permissions/
│   │   │       └── page.tsx                   # Role permissions
│   │   │
│   │   └── _components/                       # Staff-specific components
│   │       ├── StaffSidebar.tsx
│   │       ├── UserActionsMenu.tsx
│   │       ├── PaymentApprovalCard.tsx
│   │       ├── PoolStatusBadge.tsx
│   │       ├── GoNoGoMeter.tsx
│   │       └── RevenueChart.tsx
│   │
│   ├── applicant/                             # 📝 APPLICANT PORTAL
│   │   ├── layout.tsx                         # Applicant layout
│   │   ├── page.tsx                           # Applicant dashboard
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx                       # Main dashboard
│   │   │
│   │   ├── application/
│   │   │   ├── status/
│   │   │   │   └── page.tsx                   # Application status
│   │   │   └── payment/
│   │   │       └── page.tsx                   # Upload payment proof
│   │   │
│   │   ├── courses/
│   │   │   ├── page.tsx                       # Browse courses
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx                   # Course details
│   │   │   └── purchase/
│   │   │       └── page.tsx                   # Purchase course
│   │   │
│   │   ├── exam-pools/
│   │   │   ├── page.tsx                       # View available pools
│   │   │   └── [id]/
│   │   │       └── page.tsx                   # Pool details
│   │   │
│   │   ├── profile/
│   │   │   └── page.tsx                       # Edit profile
│   │   │
│   │   └── _components/
│   │       ├── ApplicationStatusCard.tsx
│   │       ├── CourseCard.tsx
│   │       └── PaymentUpload.tsx
│   │
│   ├── student/                               # 🎓 STUDENT PORTAL
│   │   ├── layout.tsx                         # Student layout with sidebar
│   │   ├── page.tsx                           # Student dashboard
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx                       # Main dashboard
│   │   │
│   │   ├── wallet/
│   │   │   ├── page.tsx                       # Wallet overview
│   │   │   ├── top-up/
│   │   │   │   └── page.tsx                   # Request top-up
│   │   │   └── transactions/
│   │   │       └── page.tsx                   # Transaction history
│   │   │
│   │   ├── courses/
│   │   │   ├── page.tsx                       # My courses
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx                   # Course details
│   │   │   │   ├── materials/
│   │   │   │   │   └── page.tsx               # Course materials
│   │   │   │   └── grades/
│   │   │   │       └── page.tsx               # Course grades
│   │   │   └── enroll/
│   │   │       └── page.tsx                   # Enroll in new course
│   │   │
│   │   ├── exam-pools/
│   │   │   ├── page.tsx                       # Browse & join pools
│   │   │   ├── my-bookings/
│   │   │   │   └── page.tsx                   # My pool bookings
│   │   │   └── [id]/
│   │   │       ├── page.tsx                   # Pool details
│   │   │       └── join/
│   │   │           └── page.tsx               # Join pool
│   │   │
│   │   ├── exams/
│   │   │   ├── page.tsx                       # My exams
│   │   │   ├── schedule/
│   │   │   │   └── page.tsx                   # Exam schedule
│   │   │   └── results/
│   │   │       └── page.tsx                   # Exam results
│   │   │
│   │   ├── grades/
│   │   │   └── page.tsx                       # All grades
│   │   │
│   │   ├── attendance/
│   │   │   └── page.tsx                       # Attendance records
│   │   │
│   │   ├── seating/
│   │   │   ├── page.tsx                       # My seating (class + exam)
│   │   │   └── loading.tsx
│   │   │
│   │   ├── classmates/
│   │   │   ├── page.tsx                       # Classmate directory (6 filters)
│   │   │   └── _components/
│   │   │       └── ClassmatesFilters.tsx       # Filter tabs + sub-filters
│   │   │
│   │   ├── certificates/
│   │   │   └── page.tsx                       # Download certificates
│   │   │
│   │   ├── notifications/
│   │   │   └── page.tsx                       # Notifications
│   │   │
│   │   ├── profile/
│   │   │   ├── page.tsx                       # View/edit profile
│   │   │   ├── settings/
│   │   │   │   └── page.tsx                   # Account settings
│   │   │   └── change-password/
│   │   │       └── page.tsx                   # Change password
│   │   │
│   │   └── _components/
│   │       ├── StudentSidebar.tsx
│   │       ├── WalletCard.tsx
│   │       ├── PoolCard.tsx
│   │       ├── GradeCard.tsx
│   │       ├── AttendanceChart.tsx
│   │       └── UpcomingExamCard.tsx
│   │
│   ├── instructor/                            # 👨‍🏫 INSTRUCTOR PORTAL
│   │   ├── layout.tsx                         # Instructor layout
│   │   ├── page.tsx                           # Instructor dashboard
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx                       # Main dashboard
│   │   │
│   │   ├── classes/
│   │   │   ├── page.tsx                       # My classes
│   │   │   └── [id]/
│   │   │       ├── page.tsx                   # Class details
│   │   │       ├── roster/
│   │   │       │   └── page.tsx               # Class roster
│   │   │       ├── attendance/
│   │   │       │   └── page.tsx               # Take attendance
│   │   │       ├── grades/
│   │   │       │   └── page.tsx               # Enter grades
│   │   │       └── materials/
│   │   │           └── page.tsx               # Upload materials
│   │   │
│   │   ├── schedule/
│   │   │   └── page.tsx                       # My schedule
│   │   │
│   │   ├── students/
│   │   │   ├── page.tsx                       # My students
│   │   │   └── [id]/
│   │   │       └── page.tsx                   # Student progress
│   │   │
│   │   ├── grading/
│   │   │   ├── pending/
│   │   │   │   └── page.tsx                   # Pending grading
│   │   │   └── history/
│   │   │       └── page.tsx                   # Grading history
│   │   │
│   │   ├── profile/
│   │   │   └── page.tsx                       # Instructor profile
│   │   │
│   │   └── _components/
│   │       ├── InstructorSidebar.tsx
│   │       ├── ClassCard.tsx
│   │       ├── AttendanceForm.tsx
│   │       └── GradingForm.tsx
│   │
│   ├── api/                                   # 🔌 API ROUTES
│   │   │
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts                   # NextAuth configuration
│   │   │   └── 2fa/
│   │   │       ├── generate/
│   │   │       │   └── route.ts               # Generate TOTP secret + QR
│   │   │       ├── verify/
│   │   │       │   └── route.ts               # Verify TOTP + enable 2FA
│   │   │       └── disable/
│   │   │           └── route.ts               # Verify TOTP + disable 2FA
│   │   │
│   │   ├── public/                            # Public API (no auth)
│   │   │   ├── register/
│   │   │   │   └── route.ts                   # Registration endpoint
│   │   │   ├── contact/
│   │   │   │   └── route.ts                   # Contact form
│   │   │   └── submit-payment-proof/
│   │   │       └── route.ts                   # Upload payment proof (public)
│   │   │
│   │   ├── staff/                             # Staff API
│   │   │   ├── users/
│   │   │   │   ├── route.ts                   # List/create users
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts               # Get/update/delete user
│   │   │   │   └── create/
│   │   │   │       └── route.ts               # Manual user creation
│   │   │   │
│   │   │   ├── applicants/
│   │   │   │   ├── route.ts                   # List applicants
│   │   │   │   └── [id]/
│   │   │   │       └── approve/
│   │   │   │           └── route.ts           # Approve applicant
│   │   │   │
│   │   │   ├── students/
│   │   │   │   ├── route.ts                   # List students
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts               # Get student
│   │   │   │   │   └── wallet/
│   │   │   │   │       └── route.ts           # Student wallet ops
│   │   │   │   └── import/
│   │   │   │       └── route.ts               # Bulk import students
│   │   │   │
│   │   │   ├── enrollments/
│   │   │   │   ├── route.ts                   # List enrollments
│   │   │   │   └── [id]/
│   │   │   │       └── approve/
│   │   │   │           └── route.ts           # Approve enrollment
│   │   │   │
│   │   │   ├── payments/
│   │   │   │   ├── pending/
│   │   │   │   │   └── route.ts               # Pending payments
│   │   │   │   └── [id]/
│   │   │   │       └── approve/
│   │   │   │           └── route.ts           # Approve payment
│   │   │   │
│   │   │   ├── wallet-topups/
│   │   │   │   ├── pending/
│   │   │   │   │   └── route.ts               # Pending top-ups
│   │   │   │   └── [id]/
│   │   │   │       └── approve/
│   │   │   │           └── route.ts           # Approve top-up
│   │   │   │
│   │   │   ├── courses/
│   │   │   │   ├── route.ts                   # CRUD courses
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts               # Get/update course
│   │   │   │
│   │   │   ├── classes/
│   │   │   │   ├── route.ts                   # CRUD classes
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts               # Get/update class
│   │   │   │       ├── roster/
│   │   │   │       │   └── route.ts           # Class roster
│   │   │   │       ├── seating/
│   │   │   │       │   └── route.ts           # Class seating assignments (GET/PUT)
│   │   │   │       └── seats/
│   │   │   │           └── route.ts           # Class + classroom + enrolled students
│   │   │   │
│   │   │   ├── classrooms/
│   │   │   │   └── [id]/
│   │   │   │       └── layout/
│   │   │   │           └── route.ts           # Classroom floor plan layout (GET/PUT)
│   │   │   │
│   │   │   ├── exam-events/
│   │   │   │   ├── route.ts                   # CRUD exam events
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts               # Get/update event
│   │   │   │   │   ├── pools/
│   │   │   │   │   │   └── route.ts           # Manage pools
│   │   │   │   │   └── go-no-go/
│   │   │   │   │       └── route.ts           # Go/No-Go decision
│   │   │   │   └── upcoming/
│   │   │   │       └── route.ts               # Upcoming events
│   │   │   │
│   │   │   ├── exams/
│   │   │   │   └── sittings/
│   │   │   │       └── [id]/
│   │   │   │           └── seats/
│   │   │   │               └── route.ts       # Exam sitting seat assignments (GET/PUT)
│   │   │   │
│   │   │   ├── exam-pools/
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts               # Get/update pool
│   │   │   │       └── confirm/
│   │   │   │           └── route.ts           # Manually confirm pool
│   │   │   │
│   │   │   ├── audit-logs/
│   │   │   │   └── route.ts                   # Query audit logs
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   ├── enrollment/
│   │   │   │   │   └── route.ts               # Enrollment reports
│   │   │   │   ├── revenue/
│   │   │   │   │   └── route.ts               # Revenue reports
│   │   │   │   └── pools/
│   │   │   │       └── route.ts               # Pool analytics
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── route.ts                   # Get/update settings
│   │   │       └── [key]/
│   │   │           └── route.ts               # Get/update setting
│   │   │
│   │   ├── applicant/                         # Applicant API
│   │   │   ├── dashboard/
│   │   │   │   └── route.ts                   # Dashboard data
│   │   │   ├── courses/
│   │   │   │   ├── route.ts                   # Browse courses
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts               # Course details
│   │   │   │       └── purchase/
│   │   │   │           └── route.ts           # Purchase course
│   │   │   ├── profile/
│   │   │   │   └── route.ts                   # Update profile
│   │   │   └── upload-payment/
│   │   │       └── route.ts                   # Upload payment proof
│   │   │
│   │   ├── student/                           # Student API
│   │   │   ├── dashboard/
│   │   │   │   └── route.ts                   # Dashboard data
│   │   │   │
│   │   │   ├── wallet/
│   │   │   │   ├── route.ts                   # Wallet balance
│   │   │   │   ├── top-up/
│   │   │   │   │   └── route.ts               # Request top-up
│   │   │   │   └── transactions/
│   │   │   │       └── route.ts               # Transaction history
│   │   │   │
│   │   │   ├── courses/
│   │   │   │   ├── route.ts                   # My courses
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts               # Course details
│   │   │   │       └── materials/
│   │   │   │           └── route.ts           # Course materials
│   │   │   │
│   │   │   ├── exam-pools/
│   │   │   │   ├── available/
│   │   │   │   │   └── route.ts               # Available pools
│   │   │   │   ├── my-bookings/
│   │   │   │   │   └── route.ts               # My bookings
│   │   │   │   └── [id]/
│   │   │   │       └── join/
│   │   │   │           └── route.ts           # Join pool (with race condition fix)
│   │   │   │
│   │   │   ├── grades/
│   │   │   │   └── route.ts                   # All grades
│   │   │   │
│   │   │   ├── attendance/
│   │   │   │   └── route.ts                   # Attendance records
│   │   │   │
│   │   │   ├── exams/
│   │   │   │   ├── route.ts                   # My exams
│   │   │   │   └── results/
│   │   │   │       └── route.ts               # Exam results
│   │   │   │
│   │   │   ├── certificates/
│   │   │   │   └── route.ts                   # Download certificates
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   └── route.ts                   # Notifications
│   │   │   │
│   │   │   └── profile/
│   │   │       ├── route.ts                   # View/update profile
│   │   │       └── change-password/
│   │   │           └── route.ts               # Change password
│   │   │
│   │   ├── instructor/                        # Instructor API
│   │   │   ├── dashboard/
│   │   │   │   └── route.ts                   # Dashboard data
│   │   │   │
│   │   │   ├── classes/
│   │   │   │   ├── route.ts                   # My classes
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts               # Class details
│   │   │   │       ├── roster/
│   │   │   │       │   └── route.ts           # Class roster
│   │   │   │       ├── attendance/
│   │   │   │       │   └── route.ts           # Take attendance
│   │   │   │       └── grades/
│   │   │   │           └── route.ts           # Enter grades
│   │   │   │
│   │   │   ├── schedule/
│   │   │   │   └── route.ts                   # My schedule
│   │   │   │
│   │   │   └── profile/
│   │   │       └── route.ts                   # Update profile
│   │   │
│   │   ├── uploadthing/                       # File upload API
│   │   │   └── route.ts                       # UploadThing endpoint
│   │   │
│   │   ├── cron/                              # Scheduled tasks
│   │   │   ├── check-pools/
│   │   │   │   └── route.ts                   # Check pool confirmations
│   │   │   ├── check-events/
│   │   │   │   └── route.ts                   # Check Go/No-Go
│   │   │   └── send-reminders/
│   │   │       └── route.ts                   # Send exam reminders
│   │   │
│   │   └── webhooks/                          # Webhooks
│   │       ├── stripe/
│   │       │   └── route.ts                   # Stripe webhooks (future)
│   │       └── uploadthing/
│   │           └── route.ts                   # UploadThing webhooks
│   │
│   ├── layout.tsx                             # Root layout
│   ├── globals.css                            # Global styles
│   ├── providers.tsx                          # React context providers
│   ├── error.tsx                              # Global error boundary
│   ├── not-found.tsx                          # 404 page
│   ├── loading.tsx                            # Global loading state
│   ├── robots.txt                             # SEO robots
│   └── sitemap.ts                             # Dynamic sitemap
│
├── components/                                 # 🎨 SHARED COMPONENTS
│   ├── ui/                                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── tooltip.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── progress.tsx
│   │   ├── switch.tsx
│   │   ├── skeleton.tsx
│   │   ├── sheet.tsx
│   │   ├── alert.tsx
│   │   ├── alert-dialog.tsx
│   │   └── command.tsx
│   │
│   ├── layouts/                               # Layout components
│   │   ├── PublicNav.tsx                      # Public navbar
│   │   ├── PublicFooter.tsx                   # Public footer
│   │   ├── DashboardSidebar.tsx               # Dashboard sidebar
│   │   ├── MobileNav.tsx                      # Mobile navigation
│   │   └── BreadcrumbNav.tsx                  # Breadcrumb navigation
│   │
│   ├── shared/                                # Reusable components
│   │   ├── LoadingSpinner.tsx
│   │   ├── PageLoading.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── DataTable.tsx                      # Reusable data table
│   │   ├── Pagination.tsx
│   │   ├── SearchInput.tsx
│   │   ├── FileUpload.tsx
│   │   ├── DatePicker.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── UserAvatar.tsx
│   │   └── ThemeToggle.tsx
│   │
│   ├── Tour/                                  # Guided tour
│   │   └── AppTour.tsx                        # Role-specific react-joyride tours
│   │
│   ├── forms/                                 # Form components
│   │   ├── FormField.tsx
│   │   ├── FormError.tsx
│   │   ├── FormSuccess.tsx
│   │   └── SubmitButton.tsx
│   │
│   └── charts/                                # Chart components
│       ├── RevenueChart.tsx
│       ├── EnrollmentChart.tsx
│       ├── AttendanceChart.tsx
│       └── PoolFillChart.tsx
│
├── lib/                                        # 📚 CORE LIBRARIES (Organized by domain)
│   │
│   ├── auth/                                  # Authentication
│   │   ├── auth-options.ts                    # NextAuth config
│   │   ├── session.ts                         # Session helpers
│   │   ├── permissions.ts                     # Permission checks
│   │   └── middleware-helpers.ts              # Middleware utilities
│   │
│   ├── database/                              # Database
│   │   ├── prisma.ts                          # Prisma client
│   │   └── seed-utils.ts                      # Seed helpers
│   │
│   ├── email/                                 # Email system
│   │   ├── index.ts                           # Email exports
│   │   ├── sender.ts                          # Email sending logic
│   │   ├── templates.ts                       # Email templates
│   │   └── types.ts                           # Email types
│   │
│   ├── wallet/                                # Wallet operations
│   │   ├── index.ts                           # Wallet exports
│   │   ├── operations.ts                      # Hold/Capture/Release
│   │   ├── balance.ts                         # Balance calculations
│   │   ├── transactions.ts                    # Transaction helpers
│   │   └── types.ts                           # Wallet types
│   │
│   ├── pools/                                 # Exam pool system
│   │   ├── index.ts                           # Pool exports
│   │   ├── join.ts                            # Pool join logic
│   │   ├── confirm.ts                         # Pool confirmation
│   │   ├── validation.ts                      # Pool validation
│   │   └── types.ts                           # Pool types
│   │
│   ├── students/                              # Student management
│   │   ├── index.ts
│   │   ├── id-generator.ts                    # Safe student ID generation
│   │   ├── promotion.ts                       # Applicant → Student
│   │   └── types.ts
│   │
│   ├── staff/                                 # Staff operations
│   │   ├── index.ts
│   │   ├── permissions.ts                     # Staff permissions
│   │   ├── approvals.ts                       # Approval workflows
│   │   └── types.ts
│   │
│   ├── payments/                              # Payment processing
│   │   ├── index.ts
│   │   ├── verification.ts                    # Payment verification
│   │   ├── stripe.ts                          # Stripe integration (future)
│   │   └── types.ts
│   │
│   ├── uploads/                               # File uploads
│   │   ├── uploadthing.ts                     # UploadThing config
│   │   └── validation.ts                      # File validation
│   │
│   ├── validation/                            # Input validation
│   │   ├── schemas.ts                         # Zod schemas (all)
│   │   ├── auth.ts                            # Auth schemas
│   │   ├── student.ts                         # Student schemas
│   │   ├── pool.ts                            # Pool schemas
│   │   └── payment.ts                         # Payment schemas
│   │
│   ├── security/                              # Security utilities
│   │   ├── rate-limit.ts                      # Rate limiting
│   │   ├── encryption.ts                      # Encryption helpers
│   │   ├── sanitization.ts                    # Input sanitization
│   │   └── csrf.ts                            # CSRF protection
│   │
│   ├── analytics/                             # Analytics & reporting
│   │   ├── events.ts                          # Event tracking
│   │   ├── reports.ts                         # Report generation
│   │   └── metrics.ts                         # Metric calculations
│   │
│   └── utils/                                 # General utilities
│       ├── index.ts                           # Utility exports
│       ├── date.ts                            # Date utilities
│       ├── currency.ts                        # Currency formatting
│       ├── string.ts                          # String helpers
│       ├── array.ts                           # Array helpers
│       ├── validation.ts                      # Validation helpers
│       └── constants.ts                       # App constants
│
├── hooks/                                      # 🪝 CUSTOM REACT HOOKS
│   ├── use-current-user.ts                    # Get current user
│   ├── use-current-role.ts                    # Get current role
│   ├── use-wallet-balance.ts                  # Get wallet balance
│   ├── use-toast.ts                           # Toast notifications
│   ├── use-debounce.ts                        # Debounce values
│   ├── use-pagination.ts                      # Pagination logic
│   ├── use-table-sort.ts                      # Table sorting
│   ├── use-table-filter.ts                    # Table filtering
│   ├── use-mobile.ts                          # Mobile detection
│   └── use-confirm-dialog.ts                  # Confirm dialogs
│
├── types/                                      # 📝 TYPESCRIPT TYPES
│   ├── index.ts                               # Type exports
│   ├── next-auth.d.ts                         # NextAuth type extensions
│   ├── api.ts                                 # API response types
│   ├── database.ts                            # Database types
│   ├── wallet.ts                              # Wallet types
│   ├── pool.ts                                # Pool types
│   ├── student.ts                             # Student types
│   ├── course.ts                              # Course types
│   └── enums.ts                               # Enum types
│
├── prisma/                                     # 🗄️ DATABASE
│   ├── schema.prisma                          # Prisma schema
│   ├── seed.ts                                # Database seeding
│   ├── migrations/                            # Migration history
│   │   └── [timestamp]_[name]/
│   │       └── migration.sql
│   └── seed-data/                             # Seed data files
│       ├── users.json
│       ├── courses.json
│       └── settings.json
│
├── public/                                     # 📁 PUBLIC ASSETS
│   ├── images/
│   │   ├── logos/
│   │   │   ├── aerojet-logo.png
│   │   │   └── aerojet-logo-dark.png
│   │   ├── courses/
│   │   │   ├── aircraft-engine.jpg
│   │   │   └── aircraft-maintenance.jpg
│   │   ├── partners/
│   │   │   ├── joramco.jpg
│   │   │   └── tradewinds.jpg
│   │   └── hero/
│   │       └── hero-aircraft.jpg
│   ├── documents/
│   │   ├── brochure.pdf
│   │   └── prospectus.pdf
│   ├── favicon.ico
│   ├── robots.txt                             # SEO
│   └── sitemap.xml                            # SEO
│
├── scripts/                                    # 🛠️ UTILITY SCRIPTS
│   ├── seed-database.ts                       # Database seeding
│   ├── migrate-data.ts                        # Data migration
│   ├── generate-student-ids.ts                # Bulk ID generation
│   ├── export-data.ts                         # Data export
│   ├── cleanup-old-files.ts                   # File cleanup
│   └── check-pool-status.ts                   # Pool status checker
│
├── tests/                                      # 🧪 TESTS
│   ├── unit/                                  # Unit tests
│   │   ├── lib/
│   │   │   ├── wallet.test.ts
│   │   │   ├── pools.test.ts
│   │   │   └── student-id.test.ts
│   │   └── utils/
│   │       ├── date.test.ts
│   │       └── currency.test.ts
│   │
│   ├── integration/                           # Integration tests
│   │   ├── api/
│   │   │   ├── auth.test.ts
│   │   │   ├── pool-join.test.ts
│   │   │   └── payment-approval.test.ts
│   │   └── workflows/
│   │       ├── registration.test.ts
│   │       └── pool-confirmation.test.ts
│   │
│   ├── e2e/                                   # End-to-end tests
│   │   ├── student-journey.test.ts
│   │   ├── staff-approval.test.ts
│   │   └── pool-joining.test.ts
│   │
│   ├── fixtures/                              # Test fixtures
│   │   ├── users.ts
│   │   ├── pools.ts
│   │   └── transactions.ts
│   │
│   └── setup.ts                               # Test setup
│
├── docs/                                       # 📖 DOCUMENTATION
│   ├── README.md                              # Project overview
│   ├── SETUP.md                               # Setup instructions
│   ├── API.md                                 # API documentation
│   ├── DATABASE.md                            # Database schema docs
│   ├── DEPLOYMENT.md                          # Deployment guide
│   ├── SECURITY.md                            # Security guidelines
│   ├── CONTRIBUTING.md                        # Contribution guide
│   ├── CHANGELOG.md                           # Change history
│   └── architecture/
│       ├── system-overview.md
│       ├── data-flow.md
│       └── security-model.md
│
├── .env.local                                  # 🔐 Local environment variables
├── .env.example                                # Environment template
├── .env.production                             # Production variables (not in git)
├── .env.staging                                # Staging variables (not in git)
│
├── .gitignore                                  # Git ignore rules
├── .eslintrc.json                              # ESLint configuration
├── .prettierrc                                 # Prettier configuration
├── .prettierignore                             # Prettier ignore
│
├── components.json                             # shadcn/ui config
├── next.config.ts                              # Next.js configuration
├── postcss.config.mjs                          # PostCSS configuration
├── tailwind.config.ts                          # Tailwind configuration
├── tsconfig.json                               # TypeScript configuration
│
├── package.json                                # Dependencies
├── package-lock.json                           # Dependency lock
├── vitest.config.ts                            # Vitest configuration
│
├── middleware.ts                               # Next.js middleware (auth)
│
├── README.md                                   # Project README
└── LICENSE                                     # License file
```

---

## 📂 KEY DIRECTORY EXPLANATIONS

### **1. Portal Separation (`app/` subdirectories)**

Each portal is **completely independent** with its own:
- Layout (with custom sidebar/nav)
- Pages
- Components (in `_components/` subdirectory)
- Loading/Error states

**Benefits:**
- Easy to find portal-specific code
- No mixing of staff/student/instructor logic
- Can deploy portals separately if needed
- Clear access control boundaries

### **2. API Route Organization (`app/api/`)**

APIs are organized by **portal** and then by **resource**:
- `/api/public/*` - No auth required
- `/api/staff/*` - Staff/Admin only
- `/api/applicant/*` - Applicant access
- `/api/student/*` - Student access
- `/api/instructor/*` - Instructor access

**Benefits:**
- Middleware can protect entire portal API folders
- Easy to locate API endpoints
- Clear separation of concerns
- Consistent naming conventions

### **3. Library Organization (`lib/`)**

Libraries are organized by **domain/feature**:
- `lib/auth/` - All authentication logic
- `lib/wallet/` - All wallet operations
- `lib/pools/` - All pool logic
- `lib/email/` - All email sending
- `lib/validation/` - All Zod schemas

**Benefits:**
- Related code grouped together
- Easy to import (e.g., `import { holdFunds } from '@/lib/wallet'`)
- Reduces cognitive load
- Scalable architecture

### **4. Component Organization (`components/`)**

Components are organized by **type**:
- `ui/` - shadcn/ui components (low-level)
- `layouts/` - Layout components (nav, footer, sidebar)
- `shared/` - Reusable business components
- `forms/` - Form-related components
- `charts/` - Data visualization

Portal-specific components stay in portal folders:
- `app/(student)/_components/` - Student-only components
- `app/(staff)/_components/` - Staff-only components

**Benefits:**
- Clear component hierarchy
- Easy to find reusable components
- No confusion about component purpose
- Prevents duplication

### **5. Type Definitions (`types/`)**

All TypeScript types centralized:
- `next-auth.d.ts` - NextAuth extensions
- `api.ts` - API response types
- Domain-specific type files

**Benefits:**
- Single source of truth for types
- Easy to share types across app
- Type consistency
- Auto-complete everywhere

---

## 🔐 SECURITY FEATURES IN STRUCTURE

### **1. Middleware Protection**

```typescript
// middleware.ts
export const config = {
  matcher: [
    "/staff/:path*",      // Protect staff portal
    "/applicant/:path*",  // Protect applicant portal
    "/student/:path*",    // Protect student portal
    "/instructor/:path*"  // Protect instructor portal
  ]
}
```

### **2. API Route Protection**

Each API route folder can have its own middleware:

```typescript
// app/api/staff/middleware.ts
export function middleware(request) {
  // Check if user is STAFF or ADMIN
}
```

### **3. Separate Validation Schemas**

All input validation in one place:
- `lib/validation/schemas.ts` - All Zod schemas
- Import and use in API routes and forms
- Consistent validation across app

### **4. Rate Limiting**

```typescript
// lib/security/rate-limit.ts
import { rateLimit } from './rate-limit'

// Use in API routes
const { success } = rateLimit(identifier, 5, 60000)
```

### **5. File Upload Security**

```typescript
// lib/uploads/validation.ts
export function validateFile(file: File) {
  // Check file size, type, content
}
```

---

## ⚡ PERFORMANCE FEATURES IN STRUCTURE

### **1. Code Splitting by Portal**

Each portal loads **only its code**:
- Student portal doesn't load staff code
- Applicant portal doesn't load student code
- Reduces bundle size significantly

### **2. Lazy Loading Components**

```typescript
// Use dynamic imports for heavy components
const HeavyChart = dynamic(() => import('@/components/charts/RevenueChart'))
```

### **3. API Route Caching**

```typescript
// app/api/student/courses/route.ts
export const dynamic = 'force-static' // or 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
```

### **4. Image Optimization**

All images in `public/images/` optimized:
- WebP format
- Proper sizing
- Lazy loading

### **5. Database Query Optimization**

```typescript
// lib/database/prisma.ts
// Add query extensions
// Add caching layer
```

---

## 🧩 MAINTAINABILITY FEATURES

### **1. Clear Naming Conventions**

- **Folders:** kebab-case (`exam-pools/`)
- **Files:** kebab-case (`pool-join.ts`)
- **Components:** PascalCase (`StudentSidebar.tsx`)
- **Functions:** camelCase (`holdFunds()`)

### **2. Consistent File Structure**

Every portal follows same pattern:
```
(portal)/
├── layout.tsx
├── page.tsx
├── loading.tsx
├── error.tsx
├── [feature]/
│   └── page.tsx
└── _components/
    └── Component.tsx
```

### **3. Index Files for Easy Imports**

```typescript
// lib/wallet/index.ts
export * from './operations'
export * from './balance'
export * from './types'

// Import anywhere:
import { holdFunds, calculateBalance } from '@/lib/wallet'
```

### **4. Colocation of Related Code**

Portal-specific code stays **in** the portal:
```
app/(student)/
├── dashboard/
│   ├── page.tsx              # Dashboard page
│   └── _components/          # Dashboard components
│       └── WalletCard.tsx    # Only used here
```

### **5. Type Safety Everywhere**

```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Use in all API routes
return NextResponse.json<ApiResponse<Student>>({ ... })
```

---

## 📦 DEPENDENCIES ORGANIZATION

### **Core Dependencies**

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "@prisma/client": "^6.19.2",
    "next-auth": "^4.24.13",
    "bcryptjs": "^3.0.3",
    "zod": "^3.22.4",
    "uploadthing": "^7.7.4",
    "resend": "^6.9.1"
  }
}
```

### **Development Dependencies**

```json
{
  "devDependencies": {
    "typescript": "^5",
    "prisma": "^6.19.2",
    "eslint": "^9",
    "vitest": "^4.0.18",
    "prettier": "^3.2.5",
    "@types/bcryptjs": "^2.4.6"
  }
}
```

---

## 🚀 DEPLOYMENT STRUCTURE

### **Environment Files**

```
.env.local          # Local development (gitignored)
.env.example        # Template (committed)
.env.staging        # Staging (gitignored)
.env.production     # Production (gitignored)
```

### **Build Output**

```
.next/              # Next.js build output (gitignored)
├── cache/
├── server/
└── static/
```

### **Deployment Configs**

```
.github/workflows/
├── ci.yml                    # Run tests on PR
├── deploy-staging.yml        # Deploy to staging on merge to develop
└── deploy-production.yml     # Deploy to prod on merge to main
```

---

## ✅ BENEFITS OF THIS STRUCTURE

### **1. Security ✅**
- Clear separation of portal code
- Middleware protection by folder
- Centralized validation
- Rate limiting infrastructure
- Secure file uploads

### **2. Performance ✅**
- Code splitting by portal
- Lazy loading
- Optimized images
- Efficient caching
- Small bundle sizes

### **3. Maintainability ✅**
- Easy to find code
- Consistent patterns
- Clear naming
- Colocation of related code
- Type safety everywhere

### **4. Scalability ✅**
- Add new portals easily
- Add new features easily
- Independent deployments possible
- Modular architecture
- Clean dependencies

### **5. Developer Experience ✅**
- Fast navigation
- Intuitive structure
- Great IDE support
- Easy onboarding
- Clear documentation

---

## 🎯 QUICK NAVIGATION GUIDE

**Want to edit:**
- Public homepage? → `app/(public)/page.tsx`
- Student dashboard? → `app/(student)/dashboard/page.tsx`
- Pool join logic? → `lib/pools/join.ts`
- Wallet operations? → `lib/wallet/operations.ts`
- Staff sidebar? → `app/(staff)/_components/StaffSidebar.tsx`
- API for pool join? → `app/api/student/exam-pools/[id]/join/route.ts`
- Database schema? → `prisma/schema.prisma`
- Email templates? → `lib/email/templates.ts`
- Validation schemas? → `lib/validation/schemas.ts`

**Want to add:**
- New public page? → `app/(public)/new-page/page.tsx`
- New student feature? → `app/(student)/new-feature/page.tsx`
- New API endpoint? → `app/api/[portal]/[resource]/route.ts`
- New shared component? → `components/shared/NewComponent.tsx`
- New utility function? → `lib/utils/[domain].ts`

---

## 📝 NOTES

1. **All portal folders use route groups:** `(public)`, `(staff)`, etc. - This keeps URLs clean
2. **Portal-specific components use `_components/` prefix** - Keeps them private
3. **All imports use `@/` alias** - Configured in `tsconfig.json`
4. **Types centralized but can be colocated** - Balance between centralization and locality
5. **Test files mirror source structure** - Easy to find related tests

---

**This structure will scale to 100k+ lines of code while remaining maintainable! 🚀**

