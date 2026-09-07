'use client'

import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { EventData, STATUS, Step } from 'react-joyride'
import { markTourAsCompleted } from '@/app/(portal)/_actions/user'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const Joyride = dynamic(() => import('react-joyride').then((m) => m.Joyride), { ssr: false })

/** Live, state-dependent data that makes tour copy actionable instead of generic. */
export interface StaffAlert {
  id: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  title: string
  description?: string
  count?: number
}

export interface TourData {
  /** Student: wallet balance (available + currency) */
  walletBalance?: { available: number; currency: string }
  /** Student/Instructor/Applicant: unread notification count */
  unreadNotifications?: number
  /** Student/Applicant: payment access level / registration status */
  paymentAccessLevel?: string
  /** Staff: dashboard alerts (live, cached) */
  staffAlerts?: StaffAlert[]
  /** Instructor: pending grading count */
  pendingGrading?: number
  /** Applicant: current pipeline stage */
  applicationStage?: string | null
  /** Examiner: pending internal exam reports count */
  pendingExamReports?: number
}

interface Props {
  hasCompletedTour: boolean
  userRole?: string
  data?: TourData
}

/**
 * Scroll offset (px) applied to every step that targets a sidebar or topbar
 * element. This clears the sticky topbar so the highlight isn't hidden behind
 * it, and prevents the spotlight from clipping at viewport edges.
 */
export const SCROLL_OFFSET = 96

/**
 * Build a step with scroll-to behavior baked in. Every sidebar/topbar target
 * gets `scrollOffset` so the page scrolls the element past the sticky topbar
 * (96px) before the highlight appears. Scrolling is enabled by default in
 * react-joyride — `scrollOffset` controls the distance from the element.
 */

export function stepWithScroll(step: Omit<Step, 'key'> & { target: string }): Step {
  return {
    ...step,
    scrollOffset: SCROLL_OFFSET,
  }
}

/**
 * Resolve the tour steps for a given role. Steps target stable `data-tour-id`
 * attributes (assigned to sidebar nav items / topbar controls) rather than
 * fragile `a[href]` selectors, so collapsed-group children and
 * conditionally-rendered links never break targeting.
 *
 * Content is state-driven: where `context` carries live data (wallet balance,
 * unread counts, staff alerts, pending grading, pending exam reports) it is
 * surfaced directly — the tour points at *reliable information*, not just UI
 * labels.
 */
export function getSteps(role: string | undefined, ctx: TourData | undefined): Step[] {
  const balance = ctx?.walletBalance?.available
  const currency = ctx?.walletBalance?.currency ?? 'EUR'
  const unread = ctx?.unreadNotifications ?? 0
  const pendingGrading = ctx?.pendingGrading ?? 0
  const alerts = ctx?.staffAlerts ?? []
  const appStage = ctx?.applicationStage
  const pendingExamReports = ctx?.pendingExamReports ?? 0

  const moneyFmt = (n: number) => new Intl.NumberFormat('en-US').format(n)

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  /*  Common steps used by every portal                               */
  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const commonStart: Step[] = [
    {
      target: 'body',
      content: (
        <div className="space-y-2 text-left">
          <p className="text-lg font-bold text-aerojet-blue">
            Welcome to Aerojet Academy!
          </p>
          <p className="text-sm text-slate-600">
            Let&apos;s take a quick tour of your portal. Each step highlights a
            feature and the <strong>key information</strong> it carries — not
            just what it does.
          </p>
        </div>
      ),
      placement: 'center',
      skipBeacon: true,
    },
    {
      target: '[data-tour-id="topbar-tour-trigger"]',
      content: (
        <div className="space-y-1 text-left">
          <p className="font-bold">Need help?</p>
          <p className="text-sm text-slate-600">
            Click this info icon anytime to restart the tour. It&apos;s always
            available in your topbar.
          </p>
        </div>
      ),
      placement: 'bottom',
      scrollOffset: SCROLL_OFFSET,
    },
    {
      target: '#welcome-banner',
      content: (
        <div className="space-y-1 text-left">
          <p className="font-bold">Updates &amp; Announcements</p>
          <p className="text-sm text-slate-600">
            This banner carries personalized messages and critical academy
            announcements. Check it for payment deadlines, exam changes, and
            account alerts.
          </p>
        </div>
      ),
      placement: 'bottom',
      scrollOffset: SCROLL_OFFSET,
    },
    {
      target: '#sidebar-user-menu',
      content: (
        <div className="space-y-1 text-left">
          <p className="font-bold">Your Account</p>
          <p className="text-sm text-slate-600">
            Access your profile, switch between light and dark themes, or sign
            out. You can restart this tour anytime from here.
          </p>
        </div>
      ),
      placement: 'top',
      scrollOffset: SCROLL_OFFSET,
    },
  ]

  const commonFinish = (headline: string, sub: string): Step => ({
    target: 'body',
    content: (
      <div className="space-y-2 text-left">
        <p className="text-lg font-bold text-aerojet-blue">{headline}</p>
        <p className="text-sm text-slate-600 whitespace-pre-line">{sub}</p>
      </div>
    ),
    placement: 'center',
  })

  // â”€â”€ STUDENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (role === 'STUDENT') {
    const walletContent = (
      <div className="space-y-1 text-left">
        <p className="font-bold">Wallet</p>
        <p className="text-sm text-slate-600">
          All exam fees, course fees, and booking deposits are paid from here.
          Top up before payment deadlines or your exam seat reservations may be
          released.
        </p>
        {typeof balance === 'number' ? (
          <p
            className={`text-sm font-bold ${balance < 50 ? 'text-red-600' : 'text-emerald-700'}`}
          >
            Balance: {currency} {moneyFmt(balance)}
          </p>
        ) : null}
      </div>
    )

    return [
      ...commonStart,
      stepWithScroll({
        target: '[data-tour-id="nav-dashboard"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Dashboard</p>
            <p className="text-sm text-slate-600">
              Your study overview — deadlines, wallet status, and quick links to
              what needs doing today.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="nav-wallet"]',
        content: walletContent,
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="group-academic"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Academic Center</p>
            <p className="text-sm text-slate-600">
              Enroll in modules, access study resources, and check your academic
              calendar for term dates and deadlines.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="group-exams"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Exams</p>
            <p className="text-sm text-slate-600">
              Book exam seats, join pools for shared pricing, view your exam
              history, and check results. Seat reservations expire if not
              confirmed before the booking deadline.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="group-progress"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Progress</p>
            <p className="text-sm text-slate-600">
              Grades, transcript, certificates, and license progress. Results are
              released per exam schedule — check back after the published date.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="group-academy-life"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Academy Life</p>
            <p className="text-sm text-slate-600">
              Classmates, attendance, seating plans, and your OJT logbook.
              Attendance below the required threshold risks enrollment status.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="nav-notifications"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Notifications</p>
            <p className="text-sm text-slate-600">
              Payment confirmations, exam reminders, result releases, and
              academy announcements. Action-required items are flagged.
            </p>
            {unread > 0 ? (
              <p className="text-sm font-bold text-amber-600">
                {unread} unread — check for deadlines
              </p>
            ) : null}
          </div>
        ),
        placement: 'right',
      }),
      commonFinish(
        'You&apos;re all set!',
        'Explore your portal at your own pace. Restart the tour anytime from your profile menu.',
      ),
    ]
  }

  // â”€â”€ STAFF (ADMIN / SUPER_ADMIN) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(role || '')) {
    const alertLines = alerts.length
      ? alerts.map((a) => `• ${a.title}`).join('\n')
      : 'No critical alerts right now.'

    return [
      ...commonStart,
      stepWithScroll({
        target: '[data-tour-id="nav-dashboard"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Staff Dashboard</p>
            <p className="text-sm text-slate-600">
              Live alerts surface at a glance — payments awaiting reconciliation,
              overdue GDPR requests, fraud-flagged referrals, and expiring exam
              bundles.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="group-people"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">People</p>
            <p className="text-sm text-slate-600">
              Students, instructors, examiners, applicants, and withdrawal
              requests. Pending applicant reviews and payment proofs trigger
              live dashboard alerts.
            </p>
            {unread > 0 ? (
              <p className="text-sm font-bold text-amber-600">
                {unread} unread notifications
              </p>
            ) : null}
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="group-financials"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Financials</p>
            <p className="text-sm text-slate-600">
              Payments, reconciliation, refunds, and financial reports. Payment
              Proofs pending more than 7 days risk breaching the SLA.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="group-operations"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Exam Operations</p>
            <p className="text-sm text-slate-600">
              Exam management, pool members, seat assignments, and batch
              processing. Over/under-booked pools are flagged here.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="group-governance"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Governance</p>
            <p className="text-sm text-slate-600">
              GDPR requests and RBAC permissions. Overdue DSRs breach the
              30-day Article 12(3) response window.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="topbar-notifications"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Alerts</p>
            <p className="text-sm text-slate-600">
              The bell surfaces pending actions across payments, applicants, and
              enrollments. Check the dashboard AlertsCenter for full detail.
            </p>
          </div>
        ),
        placement: 'bottom',
      }),
      commonFinish(
        'Ready to go!',
        `Current critical alerts:\n${alertLines}\n\nResolve high-priority items in the dashboard. You can restart this tour anytime from your profile menu.`,
      ),
    ]
  }

  // â”€â”€ INSTRUCTOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (role === 'INSTRUCTOR') {
    return [
      ...commonStart,
      stepWithScroll({
        target: '[data-tour-id="nav-dashboard"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Dashboard</p>
            <p className="text-sm text-slate-600">
              Your teaching overview — upcoming classes, schedule, and grading
              workload.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="nav-schedule"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Schedule & Availability</p>
            <p className="text-sm text-slate-600">
              Your teaching schedule and availability preferences. Keep
              availability current so the scheduler can assign you to classes.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="nav-grading"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Grading</p>
            <p className="text-sm text-slate-600">
              Submissions awaiting your review. Return grades within the
              published turnaround window to keep results on schedule.
            </p>
            {pendingGrading > 0 ? (
              <p className="text-sm font-bold text-amber-600">
                {pendingGrading} submission{pendingGrading === 1 ? '' : 's'} pending
              </p>
            ) : null}
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="nav-courses"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Courses & Resources</p>
            <p className="text-sm text-slate-600">
              Your assigned classes, teaching materials, and student rosters.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      commonFinish(
        'All caught up!',
        'Clear grading quickly to unblock student results. Restart the tour anytime from your profile menu.',
      ),
    ]
  }

  // â”€â”€ EXAMINER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (role === 'EXAMINER') {
    return [
      ...commonStart,
      stepWithScroll({
        target: '[data-tour-id="nav-results-entry"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Results Entry</p>
            <p className="text-sm text-slate-600">
              Enter and submit candidate results. Results are locked once
              published — review before submitting.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="nav-results-history"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Results History</p>
            <p className="text-sm text-slate-600">
              Previously submitted results. Amendments require a compliance note.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="nav-compliance"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Compliance</p>
            <p className="text-sm text-slate-600">
              Audit trail and compliance flags for exam administration. Resolve
              flagged items before the next review cycle.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      stepWithScroll({
        target: '[data-tour-id="nav-availability"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Availability</p>
            <p className="text-sm text-slate-600">
              Set your availability windows so the scheduler can assign you to
              exam sittings. Keep these current to avoid conflicts.
            </p>
          </div>
        ),
        placement: 'right',
      }),
      commonFinish(
        'Examination ready!',
        `Pending exam reports awaiting your review: ${pendingExamReports}.\n\nYour entries must meet published deadlines. Restart the tour anytime from your profile menu.`,
      ),
    ]
  }

  // â”€â”€ APPLICANT / DEFAULT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stageLabel = appStage ? `Current stage: ${appStage}` : 'Check the sidebar for your current step.'
  return [
    ...commonStart,
    stepWithScroll({
      target: '[data-tour-id="nav-dashboard"]',
      content: (
        <div className="space-y-1 text-left">
          <p className="font-bold">Application Dashboard</p>
          <p className="text-sm text-slate-600">
            Your application status, next required step, and pending actions.
            {stageLabel}
          </p>
        </div>
      ),
      placement: 'right',
    }),
    stepWithScroll({
      target: '[data-tour-id="nav-application"]',
      content: (
        <div className="space-y-1 text-left">
          <p className="font-bold">My Application</p>
          <p className="text-sm text-slate-600">
            Track your pipeline: documents, aptitude test, interview, and medical.
            Each stage must be complete before the next unlocks.
          </p>
        </div>
      ),
      placement: 'right',
    }),
    stepWithScroll({
      target: '[data-tour-id="nav-documents"]',
      content: (
        <div className="space-y-1 text-left">
          <p className="font-bold">Documents</p>
          <p className="text-sm text-slate-600">
            Upload required documents. Incomplete documents delay your
            application — flagged here with expiry dates.
          </p>
        </div>
      ),
      placement: 'right',
    }),
    stepWithScroll({
      target: '[data-tour-id="nav-wallet"]',
      content: (
        <div className="space-y-1 text-left">
          <p className="font-bold">Wallet</p>
          <p className="text-sm text-slate-600">
            Pay your registration fee and other dues. An unpaid balance blocks
            course enrollment and exam booking.
          </p>
          {typeof balance === 'number' ? (
            <p className="text-sm font-bold text-emerald-700">
              Balance: {currency} {moneyFmt(balance)}
            </p>
          ) : null}
        </div>
      ),
      placement: 'right',
    }),
    stepWithScroll({
      target: '[data-tour-id="nav-notifications"]',
      content: (
        <div className="space-y-1 text-left">
          <p className="font-bold">Notifications</p>
          <p className="text-sm text-slate-600">
            Document requests, interview invites, and payment reminders.
          </p>
          {unread > 0 ? (
            <p className="text-sm font-bold text-amber-600">
              {unread} unread — action required
            </p>
          ) : null}
        </div>
      ),
      placement: 'right',
    }),
    commonFinish(
      'Get Started',
      'Complete your profile, upload required documents, and pay your registration fee to proceed with enrollment. Check the sidebar for each step.',
    ),
  ]
}

/**
 * Drop any step whose target element is missing from the DOM OR not visible
 * (e.g. `display:none`). Keeps the tour robust against conditionally-rendered
 * nav links (group children that only mount when expanded, wallet links gated
 * on payment status, hidden welcome banners on small screens). `body` targets
 * always pass.
 *
 * Uses `getComputedStyle(el).display` rather than `offsetParent` /
 * `getBoundingClientRect()` — jsdom (and some SSR contexts) do not compute
 * layout, so those APIs return zeroed values. `getComputedStyle` works reliably.
 */
export function filterLiveSteps(steps: Step[]): Step[] {
  if (typeof document === 'undefined') return steps
  return steps.filter((s) => {
    const t = typeof s.target === 'string' ? s.target : undefined
    if (!t || t === 'body') return true
    try {
      const el = document.querySelector(t)
      if (!el) return false
      // Check display:none via computed style (works in jsdom)
      const display = window.getComputedStyle(el).display
      if (display === 'none') return false
      return true
    } catch {
      return true
    }
  })
}

export default function AppTour({ hasCompletedTour, userRole, data }: Props) {
  const { data: session } = useSession()
  const [run, setRun] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const tourStartedRef = useRef(false)

  useEffect(() => {
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)

    const trackTourStart = () => {
      if (tourStartedRef.current) return
      tourStartedRef.current = true
      setRun(true)
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'TOUR_STARTED',
          data: { tourName: 'app_tour' },
          userId: session?.user?.id,
        }),
      }).catch(() => {})
    }

    const handleStartTour = () => {
      trackTourStart()
    }
    window.addEventListener('start-app-tour', handleStartTour)

    if (!hasCompletedTour) {
      const timer = setTimeout(() => {
        trackTourStart()
      }, 1500)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('start-app-tour', handleStartTour)
      }
    }

    return () => window.removeEventListener('start-app-tour', handleStartTour)
  }, [hasCompletedTour, session?.user?.id])

  if (!mounted) return null

  const steps = filterLiveSteps(getSteps(userRole, data))

  const handleJoyrideCallback = async (data: EventData) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRun(false)
      await markTourAsCompleted()
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'TOUR_COMPLETED',
          data: { tourName: 'app_tour' },
          userId: session?.user?.id,
        }),
      }).catch(() => {})
      router.refresh()
    }
  }

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      steps={steps}
      options={{
        primaryColor: '#0055D4',
        zIndex: 10000,
        backgroundColor: '#ffffff',
        arrowColor: '#ffffff',
        textColor: '#334155',
        arrowSize: 10,
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
        scrollOffset: SCROLL_OFFSET,
        scrollDuration: 400,
        spotlightPadding: { top: 16, right: 24, bottom: 16, left: 16 },
        spotlightRadius: 12,
        offset: 16,
      }}
      styles={{
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '16px',
          padding: '10px',
        },
        buttonPrimary: {
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
        buttonBack: {
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginRight: '10px',
          color: '#64748b',
        },
        buttonSkip: {
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#94a3b8',
        },
      }}
      locale={{
        last: 'Finish',
        skip: 'Skip Tour',
      }}
    />
  )
}
