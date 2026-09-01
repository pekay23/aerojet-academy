'use client'

import { useMemo } from 'react'
import {
  UserPlus,
  CreditCard,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Milestone,
  ArrowRight,
  CalendarDays,
  TrendingUp,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(ms: number): string {
  if (ms < 0) return '—'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    const remainingHours = hours % 24
    return days === 1
      ? remainingHours > 0
        ? `1 day, ${remainingHours}h`
        : '1 day'
      : remainingHours > 0
        ? `${days} days, ${remainingHours}h`
        : `${days} days`
  }
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m`
  return 'Instant'
}

function durationBetween(
  a: string | Date | null | undefined,
  b: string | Date | null | undefined
): string | null {
  if (!a || !b) return null
  const diff = new Date(b).getTime() - new Date(a).getTime()
  if (diff < 0) return null
  return formatDuration(diff)
}

// ─── Timeline event structure ────────────────────────────────
interface TimelineEvent {
  id: string
  date: Date
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate' | 'emerald' | 'sky'
  category: 'account' | 'payment' | 'enrollment' | 'exam' | 'wallet' | 'milestone'
  metadata?: Record<string, string>
}

const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-300 dark:border-blue-700',
    icon: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  green: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-300 dark:border-emerald-700',
    icon: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-300 dark:border-amber-700',
    icon: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-700',
    icon: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-300 dark:border-purple-700',
    icon: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    border: 'border-slate-300 dark:border-slate-700',
    icon: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    badge: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-300 dark:border-emerald-700',
    icon: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  sky: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    border: 'border-sky-300 dark:border-sky-700',
    icon: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  },
}

// ─── Component ──────────────────────────────────────────────────
interface Props {
  student: any
}

export default function JourneyTab({ student }: Props) {
  const events = useMemo(() => buildTimeline(student), [student])

  // Summary stats
  const stats = useMemo(() => {
    const signupDate = new Date(student.createdAt)
    const now = new Date()
    const totalDuration = now.getTime() - signupDate.getTime()

    const regPaymentDate = student.paymentApprovedAt ? new Date(student.paymentApprovedAt) : null
    const timeToRegPayment = regPaymentDate ? regPaymentDate.getTime() - signupDate.getTime() : null

    const enrollmentDate = student.studentProfile?.enrollmentDate
      ? new Date(student.studentProfile.enrollmentDate)
      : null
    const timeToEnrollment = enrollmentDate ? enrollmentDate.getTime() - signupDate.getTime() : null

    // Wallet top-ups
    const walletTopUps = (student.walletTransactions || [])
      .filter((t: any) => t.type === 'TOP_UP')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

    // Approved payment records (registration, services, etc.)
    const approvedPayments = (student.payments || [])
      .filter((p: any) => p.status === 'APPROVED' || p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

    const totalPayments = walletTopUps + approvedPayments

    const bookings = student.examBookings || []
    const results = student.examResults || []

    const examCount = bookings.length
    const examsPassed = results.filter((r: SerializedExamResult) => r.passed).length

    return {
      totalDuration: formatDuration(totalDuration),
      timeToRegPayment: timeToRegPayment ? formatDuration(timeToRegPayment) : null,
      timeToEnrollment: timeToEnrollment ? formatDuration(timeToEnrollment) : null,
      totalPayments,
      examCount,
      examsPassed,
      totalEvents: events.length,
    }
  }, [student, events])

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Clock} label="Time Since Signup" value={stats.totalDuration} color="blue" />
        <StatCard
          icon={CreditCard}
          label="Time to Reg Payment"
          value={stats.timeToRegPayment || 'Pending'}
          color={stats.timeToRegPayment ? 'green' : 'amber'}
        />
        <StatCard
          icon={GraduationCap}
          label="Time to Enrollment"
          value={stats.timeToEnrollment || 'Pending'}
          color={stats.timeToEnrollment ? 'green' : 'amber'}
        />
        <StatCard
          icon={Wallet}
          label="Total Deposited"
          value={`€${stats.totalPayments.toLocaleString()}`}
          color="purple"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Exams Booked"
          value={String(stats.examCount)}
          color="sky"
        />
        <StatCard
          icon={CheckCircle2}
          label="Exams Passed"
          value={String(stats.examsPassed)}
          color="emerald"
        />
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
            <TrendingUp className="h-4 w-4" />
            Full Journey Timeline
          </h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {events.length} events
          </span>
        </div>

        {events.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No journey data available yet.</p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-linear-to-b from-blue-300 via-slate-200 to-slate-100 sm:left-6 dark:from-blue-700 dark:via-slate-700 dark:to-slate-800" />

            <div className="space-y-0">
              {events.map((event, idx) => {
                const colors = COLOR_MAP[event.color]
                const prevEvent = idx > 0 ? events[idx - 1] : null
                const gap = prevEvent ? durationBetween(prevEvent.date, event.date) : null

                return (
                  <div key={event.id}>
                    {/* Duration gap indicator */}
                    {gap && (
                      <div className="relative flex items-center py-1.5 pl-[26px] sm:pl-[30px]">
                        <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                          <ArrowRight className="h-3 w-3" />
                          {gap}
                        </div>
                      </div>
                    )}

                    {/* Event node */}
                    <div className="group relative flex items-start gap-3 py-2 sm:gap-4">
                      {/* Dot / Icon */}
                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 sm:h-12 sm:w-12 ${colors.bg} ${colors.border} transition-transform group-hover:scale-110`}
                      >
                        <event.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.icon}`} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 transition-colors group-hover:border-slate-200 group-hover:bg-white sm:px-4 sm:py-3 dark:border-slate-800 dark:bg-slate-800/30 dark:group-hover:border-slate-700 dark:group-hover:bg-slate-800/50">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {event.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {event.description}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-[10px] font-bold whitespace-nowrap text-slate-400">
                              {formatDate(event.date)}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${colors.badge}`}
                            >
                              {event.category}
                            </span>
                          </div>
                        </div>

                        {/* Metadata chips */}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.entries(event.metadata).map(([key, val]) => (
                              <span
                                key={key}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
                              >
                                <span className="text-slate-400">{key}:</span> {val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Build the full timeline from student data ──────────────────
function buildTimeline(student: SerializedStudent): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // 1. Account Created
  if (student.createdAt) {
    events.push({
      id: 'signup',
      date: new Date(student.createdAt),
      title: 'Account Created',
      description: `Signed up with email ${student.email}`,
      icon: UserPlus,
      color: 'blue',
      category: 'account',
      metadata: {
        'Programme Choice': student.programmeChoice?.replace(/_/g, ' ') || '—',
      },
    })
  }

  // 2. Email Verified
  if (student.emailVerified) {
    events.push({
      id: 'email-verified',
      date: new Date(student.emailVerified),
      title: 'Email Verified',
      description: 'Email address confirmed',
      icon: Shield,
      color: 'green',
      category: 'account',
    })
  }

  // 3. Registration Fee Payment (approval date or proof upload)
  if (student.paymentApprovedAt) {
    events.push({
      id: 'reg-payment-approved',
      date: new Date(student.paymentApprovedAt),
      title: 'Registration Fee Approved',
      description: `Registration fee of ${student.registrationCurrency || 'EUR'} ${Number(student.registrationFee || 350).toLocaleString()} was approved`,
      icon: CheckCircle2,
      color: 'green',
      category: 'payment',
      metadata: {
        Amount: `${student.registrationCurrency || 'EUR'} ${Number(student.registrationFee || 350).toLocaleString()}`,
      },
    })
  } else if (student.registrationPaid) {
    events.push({
      id: 'reg-payment-paid',
      date: new Date(student.updatedAt || student.createdAt),
      title: 'Registration Fee Marked Paid',
      description: 'Registration fee was recorded as paid',
      icon: CreditCard,
      color: 'green',
      category: 'payment',
    })
  }

  // 4. Student Profile / Enrollment
  if (student.studentProfile?.enrollmentDate) {
    events.push({
      id: 'enrollment',
      date: new Date(student.studentProfile.enrollmentDate),
      title: 'Enrolled as Student',
      description: `Role upgraded to Student. ${student.studentProfile.enrollmentType?.replace(/_/g, ' ') || ''} enrollment.`,
      icon: GraduationCap,
      color: 'purple',
      category: 'enrollment',
      metadata: {
        'Student ID': student.studentProfile.studentId || '—',
        Type: student.studentProfile.enrollmentType?.replace(/_/g, ' ') || '—',
        Pathway: student.studentProfile.pathwayRel?.name || '—',
      },
    })
  }

  // 5. Pathway Locked
  if (student.studentProfile?.studyPathwayLocked && student.studentProfile.studyPathwayLockedAt) {
    events.push({
      id: 'pathway-locked',
      date: new Date(student.studentProfile.studyPathwayLockedAt),
      title: 'Study Pathway Locked',
      description: `Pathway set to "${student.studentProfile.pathwayRel?.name || '—'}" and locked.`,
      icon: Shield,
      color: 'amber',
      category: 'enrollment',
    })
  }

  // 6. Full-Time Enrollments
  const fullTimeEnrollments = student.fullTimeEnrollments || []
  for (const fte of fullTimeEnrollments) {
    events.push({
      id: `fte-${fte.id}`,
      date: new Date(fte.startDate || fte.createdAt),
      title: `Full-Time Programme Enrollment`,
      description: `Enrolled in ${fte.programme?.name || fte.programme?.code || 'Unknown'}`,
      icon: BookOpen,
      color: 'blue',
      category: 'enrollment',
      metadata: {
        Programme: fte.programme?.name || fte.programme?.code || '—',
        Year: `Year ${fte.currentYearNumber}`,
        Status: fte.status?.replace(/_/g, ' ') || '—',
        'Academic Year': fte.academicYear || '—',
      },
    })

    // Payment Milestones
    const milestones = fte.milestones || []
    for (const ms of milestones) {
      if (ms.paidAt) {
        events.push({
          id: `milestone-${ms.id}`,
          date: new Date(ms.paidAt),
          title: `Payment Milestone: ${ms.milestoneType?.replace(/_/g, ' ')}`,
          description: `Year ${ms.yearNumber} — ${student.registrationCurrency || 'EUR'} ${Number(ms.amountDue).toLocaleString()} paid`,
          icon: Milestone,
          color: 'green',
          category: 'milestone',
          metadata: {
            Type: ms.milestoneType?.replace(/_/g, ' ') || '—',
            Amount: `EUR ${Number(ms.amountDue).toLocaleString()}`,
            Year: `Year ${ms.yearNumber}`,
          },
        })
      } else {
        events.push({
          id: `milestone-due-${ms.id}`,
          date: new Date(ms.dueDate || ms.createdAt),
          title: `Milestone Due: ${ms.milestoneType?.replace(/_/g, ' ')}`,
          description: `Year ${ms.yearNumber} — EUR ${Number(ms.amountDue).toLocaleString()} due`,
          icon: AlertCircle,
          color: ms.status === 'OVERDUE' ? 'red' : 'amber',
          category: 'milestone',
          metadata: {
            Status: ms.status || 'DUE',
            Amount: `EUR ${Number(ms.amountDue).toLocaleString()}`,
          },
        })
      }
    }
  }

  // 7. Wallet Top-ups
  const walletTxns = student.walletTransactions || []
  for (const txn of walletTxns) {
    if (txn.type === 'TOP_UP') {
      events.push({
        id: `wallet-${txn.id}`,
        date: new Date(txn.createdAt),
        title: 'Wallet Top-Up',
        description: txn.description || `EUR ${Number(txn.amount).toLocaleString()} deposited`,
        icon: Wallet,
        color: 'emerald',
        category: 'wallet',
        metadata: {
          Amount: `EUR ${Number(txn.amount).toLocaleString()}`,
          'Balance After': txn.balanceAfter
            ? `EUR ${Number(txn.balanceAfter).toLocaleString()}`
            : '—',
          ...(txn.staffName ? { 'Credited By': txn.staffName } : {}),
        },
      })
    } else if (['CAPTURE', 'DEBIT', 'PAYMENT'].includes(txn.type)) {
      events.push({
        id: `wallet-spend-${txn.id}`,
        date: new Date(txn.createdAt),
        title: `Wallet ${txn.type === 'CAPTURE' ? 'Payment Captured' : txn.type === 'PAYMENT' ? 'Payment' : 'Debit'}`,
        description: txn.description || `EUR ${Number(txn.amount).toLocaleString()} spent`,
        icon: CreditCard,
        color: 'amber',
        category: 'wallet',
        metadata: {
          Amount: `EUR ${Number(txn.amount).toLocaleString()}`,
          Type: txn.type,
          ...(txn.referenceType ? { 'Ref Type': txn.referenceType } : {}),
        },
      })
    }
  }

  // 7b. Payment records (registration fee, services, etc.)
  const payments = student.payments || []
  for (const pmt of payments) {
    const statusColor =
      pmt.status === 'APPROVED' || pmt.status === 'COMPLETED'
        ? ('green' as const)
        : pmt.status === 'REJECTED'
          ? ('red' as const)
          : pmt.status === 'PENDING'
            ? ('amber' as const)
            : ('slate' as const)

    events.push({
      id: `payment-${pmt.id}`,
      date: new Date(pmt.approvedAt || pmt.createdAt),
      title: `Payment: ${pmt.referenceType?.replace(/_/g, ' ') || 'General'}`,
      description: `${pmt.currency || 'EUR'} ${Number(pmt.amount).toLocaleString()} via ${pmt.paymentMethod || 'Unknown'}`,
      icon:
        pmt.status === 'APPROVED' || pmt.status === 'COMPLETED'
          ? CheckCircle2
          : pmt.status === 'REJECTED'
            ? XCircle
            : CreditCard,
      color: statusColor,
      category: 'payment',
      metadata: {
        Amount: `${pmt.currency || 'EUR'} ${Number(pmt.amount).toLocaleString()}`,
        Status: pmt.status || '—',
        Method: pmt.paymentMethod || '—',
        ...(pmt.referenceCode ? { Ref: pmt.referenceCode } : {}),
        ...(pmt.paymentCurrency && pmt.paymentCurrency !== pmt.currency
          ? {
              'Paid In': `${pmt.paymentCurrency} ${Number(pmt.originalAmount || 0).toLocaleString()}`,
            }
          : {}),
        ...(pmt.staffName ? { 'Approved By': pmt.staffName } : {}),
      },
    })
  }

  // 8. Exam Bookings
  const bookings = student.examBookings || []
  for (const bk of bookings) {
    const moduleName =
      bk.course?.name || bk.exam?.examComponent?.course?.name || bk.moduleCode || 'Unknown Module'
    const moduleCode =
      bk.course?.code || bk.exam?.examComponent?.course?.code || bk.moduleCode || ''

    events.push({
      id: `exam-booking-${bk.id}`,
      date: new Date(bk.bookedAt || bk.createdAt),
      title: `Exam Booked: ${moduleCode}`,
      description: `${moduleName}${bk.event?.name ? ` — ${bk.event.name}` : ''}`,
      icon: ClipboardCheck,
      color:
        bk.status === 'APPROVED' || bk.status === 'CONFIRMED'
          ? 'green'
          : bk.status === 'CANCELLED'
            ? 'red'
            : 'sky',
      category: 'exam',
      metadata: {
        Status: bk.status || '—',
        Type: bk.bookingType || '—',
        Amount: `EUR ${Number(bk.amountPaid).toLocaleString()}`,
        ...(bk.examDate ? { 'Exam Date': new Date(bk.examDate).toLocaleDateString('en-GB') } : {}),
        ...(bk.isResit ? { Resit: 'Yes' } : {}),
      },
    })
  }

  // 9. Exam Results
  const results = student.examResults || []
  for (const res of results) {
    const moduleCode = res.moduleCode || res.exam?.examComponent?.course?.code || ''
    const moduleName = res.exam?.examComponent?.course?.name || moduleCode || 'Unknown'

    events.push({
      id: `exam-result-${res.id}`,
      date: new Date(res.createdAt),
      title: `Exam Result: ${moduleCode}`,
      description: `${moduleName} — ${res.passed ? 'PASSED' : 'FAILED'} (${Number(res.percentage)}%)`,
      icon: res.passed ? CheckCircle2 : XCircle,
      color: res.passed ? 'green' : 'red',
      category: 'exam',
      metadata: {
        Score: `${Number(res.score)}/${Number(res.maxScore)}`,
        Percentage: `${Number(res.percentage)}%`,
        Result: res.passed ? 'PASSED' : 'FAILED',
      },
    })
  }

  // 10. Modular Enrollments
  const modularEnrollments = student.modularEnrollments || []
  for (const me of modularEnrollments) {
    events.push({
      id: `modular-${me.id}`,
      date: new Date(me.createdAt),
      title: 'Modular Package Enrollment',
      description: `Enrolled in ${me.package?.name || 'Unknown'} package`,
      icon: BookOpen,
      color: 'purple',
      category: 'enrollment',
      metadata: {
        Package: me.package?.name || '—',
        Status: me.status || '—',
        Paid: `EUR ${Number(me.amountPaid).toLocaleString()}`,
      },
    })
  }

  // 11. Course Enrollments & Grades
  const courseEnrollments = student.enrollments || []
  for (const enr of courseEnrollments) {
    events.push({
      id: `course-enr-${enr.id}`,
      date: new Date(enr.enrolledAt || enr.createdAt),
      title: `Course Enrollment: ${enr.course?.code || 'Unknown'}`,
      description: `Enrolled in ${enr.course?.name || 'Unknown'}`,
      icon: BookOpen,
      color: 'sky',
      category: 'enrollment',
      metadata: {
        Status: enr.status || '—',
        Course: enr.course?.name || '—',
      },
    })

    const grades = enr.grades || []
    for (const grade of grades) {
      events.push({
        id: `grade-${grade.id}`,
        date: new Date(grade.assessmentDate || grade.createdAt),
        title: `Grade Recorded: ${grade.assessmentName || 'Assessment'}`,
        description: `Score: ${Number(grade.score)}/${Number(grade.maxScore)} (${Number(grade.percentage)}%) for ${enr.course?.code || 'Unknown'}`,
        icon: ClipboardCheck,
        color: 'emerald',
        category: 'exam',
        metadata: {
          Type: grade.assessmentType || '—',
          Course: enr.course?.code || '—',
          ...(grade.grade ? { Grade: grade.grade } : {}),
        },
      })
    }
  }

  // 12. Exam Bundles
  const examBundles = student.examBundles || []
  for (const eb of examBundles) {
    events.push({
      id: `exam-bundle-${eb.id}`,
      date: new Date(eb.createdAt),
      title: `Exam Bundle Purchased`,
      description: `Bundle type: ${eb.bundleType?.replace(/_/g, ' ') || 'Unknown'}`,
      icon: Wallet,
      color: 'purple',
      category: 'payment',
      metadata: {
        Seats: String(eb.totalSeats),
        'Amount Paid': `EUR ${Number(eb.amountPaid).toLocaleString()}`,
        Status: eb.status || '—',
      },
    })
  }

  // 13. Attendance Records
  const attendance = student.attendanceRecords || []
  for (const att of attendance) {
    events.push({
      id: `attendance-${att.id}`,
      date: new Date(att.date || att.createdAt),
      title: `Class Attendance`,
      description: `Status: ${att.status?.replace(/_/g, ' ')} for ${att.class?.course?.code || 'Class'}`,
      icon: Clock,
      color: att.status === 'PRESENT' ? 'green' : att.status === 'ABSENT' ? 'red' : 'amber',
      category: 'account',
      metadata: {
        Class: att.class?.name || '—',
        Course: att.class?.course?.code || '—',
        ...(att.minutesLate ? { 'Minutes Late': String(att.minutesLate) } : {}),
      },
    })
  }

  // 14. Last Login
  if (student.lastLoginAt) {
    events.push({
      id: 'last-login',
      date: new Date(student.lastLoginAt),
      title: 'Last Login',
      description: 'Most recent login activity',
      icon: CalendarDays,
      color: 'slate',
      category: 'account',
    })
  }

  // Sort chronologically
  events.sort((a, b) => a.date.getTime() - b.date.getTime())

  return events
}

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: keyof typeof COLOR_MAP
}) {
  const colors = COLOR_MAP[color]
  return (
    <div
      className={`rounded-xl border p-3 ${colors.border} ${colors.bg} transition-transform hover:scale-[1.02]`}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${colors.icon}`} />
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          {label}
        </span>
      </div>
      <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  )
}
