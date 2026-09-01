import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getSteps, filterLiveSteps, SCROLL_OFFSET } from '@/components/Tour/AppTour'
import type { Step } from 'react-joyride'

// --- Minimal mocks so the component doesn't blow up in jsdom ---
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user-1' } } }),
}))
vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => () => null,
}))
vi.mock('@/app/(portal)/_actions/user', () => ({
  markTourAsCompleted: vi.fn(),
}))

/**
 * Render a step's `content` JSX into the document and return the container
 * so we can assert on its text.
 */
function renderStepContent(step: Step) {
  const { container } = render(<>{step.content}</>)
  return container
}

/* ------------------------------------------------------------------ */
/*  getSteps — selector stability                                     */
/* ------------------------------------------------------------------ */
describe('getSteps — selector stability', () => {
  it('targets stable data-tour-id attributes or known IDs (not fragile a[href])', () => {
    const steps = getSteps('STAFF', {})
    const targets = steps.map((s) => s.target).filter((t): t is string => typeof t === 'string' && t !== 'body')

    targets.forEach((t) => {
      const isTourId = /^\[data-tour-id=/.test(t)
      const isKnownId = /^#(welcome-banner|sidebar-user-menu)$/.test(t)
      expect(isTourId || isKnownId, `Unexpected target selector: ${t}`).toBe(true)
    })
  })

  it('includes the tour-trigger step in common start', () => {
    const steps = getSteps('STUDENT', {})
    expect(steps.some((s) => s.target === '[data-tour-id="topbar-tour-trigger"]')).toBe(true)
  })

  it('includes #welcome-banner in common start (filtered at runtime if absent)', () => {
    const steps = getSteps('STAFF', {})
    expect(steps.some((s) => s.target === '#welcome-banner')).toBe(true)
  })

  it('common finish targets body', () => {
    const steps = getSteps('STAFF', {})
    const last = steps[steps.length - 1]
    expect(last.target).toBe('body')
  })
})

/* ------------------------------------------------------------------ */
/*  getSteps — role-specific coverage                                 */
/* ------------------------------------------------------------------ */
describe('getSteps — role coverage', () => {
  it('STUDENT: 7 nav-group steps + dashboard + notifications', () => {
    const steps = getSteps('STUDENT', {})
    const targets = steps.map((s) => s.target).filter(Boolean) as string[]
    expect(targets).toContain('[data-tour-id="nav-dashboard"]')
    expect(targets).toContain('[data-tour-id="nav-wallet"]')
    expect(targets).toContain('[data-tour-id="group-academic"]')
    expect(targets).toContain('[data-tour-id="group-exams"]')
    expect(targets).toContain('[data-tour-id="group-progress"]')
    expect(targets).toContain('[data-tour-id="group-academy-life"]')
    expect(targets).toContain('[data-tour-id="nav-notifications"]')
  })

  it('STAFF: 5 group steps + dashboard + topbar', () => {
    const steps = getSteps('STAFF', {})
    const targets = steps.map((s) => s.target).filter(Boolean) as string[]
    expect(targets).toContain('[data-tour-id="nav-dashboard"]')
    expect(targets).toContain('[data-tour-id="group-people"]')
    expect(targets).toContain('[data-tour-id="group-financials"]')
    expect(targets).toContain('[data-tour-id="group-operations"]')
    expect(targets).toContain('[data-tour-id="group-governance"]')
    expect(targets).toContain('[data-tour-id="topbar-notifications"]')
  })

  it('INSTRUCTOR: 3 nav steps + dashboard', () => {
    const steps = getSteps('INSTRUCTOR', {})
    const targets = steps.map((s) => s.target).filter(Boolean) as string[]
    expect(targets).toContain('[data-tour-id="nav-dashboard"]')
    expect(targets).toContain('[data-tour-id="nav-schedule"]')
    expect(targets).toContain('[data-tour-id="nav-grading"]')
    expect(targets).toContain('[data-tour-id="nav-courses"]')
  })

  it('EXAMINER: 4 nav steps', () => {
    const steps = getSteps('EXAMINER', {})
    const targets = steps.map((s) => s.target).filter(Boolean) as string[]
    expect(targets).toContain('[data-tour-id="nav-results-entry"]')
    expect(targets).toContain('[data-tour-id="nav-results-history"]')
    expect(targets).toContain('[data-tour-id="nav-compliance"]')
    expect(targets).toContain('[data-tour-id="nav-availability"]')
  })

  it('APPLICANT: pipeline steps present', () => {
    const steps = getSteps('APPLICANT', {})
    const targets = steps.map((s) => s.target).filter(Boolean) as string[]
    expect(targets).toContain('[data-tour-id="nav-dashboard"]')
    expect(targets).toContain('[data-tour-id="nav-application"]')
    expect(targets).toContain('[data-tour-id="nav-documents"]')
    expect(targets).toContain('[data-tour-id="nav-wallet"]')
    expect(targets).toContain('[data-tour-id="nav-notifications"]')
  })

  it('SUPER_ADMIN uses the same steps as STAFF', () => {
    const staffSteps = getSteps('STAFF', {})
    const superSteps = getSteps('SUPER_ADMIN', {})
    expect(staffSteps).toEqual(superSteps)
  })
})

/* ------------------------------------------------------------------ */
/*  getSteps — scroll behaviour                                       */
/* ------------------------------------------------------------------ */
describe('getSteps — scroll behaviour', () => {
  it('every non-body step has scrollTo with the shared offset', () => {
    const roles = ['STUDENT', 'STAFF', 'INSTRUCTOR', 'EXAMINER', 'APPLICANT']
    roles.forEach((role) => {
      const steps = getSteps(role, {})
      steps.forEach((s) => {
        if (s.target && s.target !== 'body') {
          expect(s.scrollOffset).toBe(SCROLL_OFFSET)
        }
      })
    })
  })
})

/* ------------------------------------------------------------------ */
/*  getSteps — state-driven content                                   */
/* ------------------------------------------------------------------ */
describe('getSteps — state-driven content', () => {
  it('STUDENT: wallet content shows balance when provided', () => {
    const steps = getSteps('STUDENT', {
      walletBalance: { available: 1250, currency: 'EUR' },
    })
    const walletStep = steps.find((s) => s.target === '[data-tour-id="nav-wallet"]')
    expect(walletStep).toBeDefined()
    renderStepContent(walletStep!)
    expect(screen.getByText('Balance: EUR 1,250')).toBeInTheDocument()
  })

  it('STUDENT: wallet content shows red warning when balance < 50', () => {
    const steps = getSteps('STUDENT', {
      walletBalance: { available: 30, currency: 'USD' },
    })
    const walletStep = steps.find((s) => s.target === '[data-tour-id="nav-wallet"]')
    expect(walletStep).toBeDefined()
    renderStepContent(walletStep!)
    expect(screen.getByText('Balance: USD 30')).toHaveClass('text-red-600')
  })

  it('STUDENT: wallet content hides balance line when balance not provided', () => {
    const steps = getSteps('STUDENT', {})
    const walletStep = steps.find((s) => s.target === '[data-tour-id="nav-wallet"]')
    expect(walletStep).toBeDefined()
    renderStepContent(walletStep!)
    expect(screen.queryByText(/Balance:/)).not.toBeInTheDocument()
  })

  it('STUDENT: notifications step shows unread count when > 0', () => {
    const steps = getSteps('STUDENT', { unreadNotifications: 3 })
    const notifStep = steps.find((s) => s.target === '[data-tour-id="nav-notifications"]')
    expect(notifStep).toBeDefined()
    renderStepContent(notifStep!)
    expect(screen.getByText('3 unread — check for deadlines')).toBeInTheDocument()
  })

  it('STUDENT: notifications step hides unread count when 0', () => {
    const steps = getSteps('STUDENT', { unreadNotifications: 0 })
    const notifStep = steps.find((s) => s.target === '[data-tour-id="nav-notifications"]')
    expect(notifStep).toBeDefined()
    renderStepContent(notifStep!)
    expect(screen.queryByText(/unread/)).not.toBeInTheDocument()
  })

  it('STAFF: finish step includes live alert titles', () => {
    const steps = getSteps('STAFF', {
      staffAlerts: [
        { id: 'a1', severity: 'CRITICAL', title: '5 overdue GDPR requests', count: 5 },
        { id: 'a2', severity: 'WARNING', title: '2 payments > 7 days', count: 2 },
      ],
    })
    const finish = steps[steps.length - 1]
    renderStepContent(finish)
    expect(screen.getByText((c) => c.includes('5 overdue GDPR requests'))).toBeInTheDocument()
    expect(screen.getByText((c) => c.includes('2 payments > 7 days'))).toBeInTheDocument()
  })

  it('STAFF: finish step shows fallback when no alerts', () => {
    const steps = getSteps('STAFF', { staffAlerts: [] })
    const finish = steps[steps.length - 1]
    renderStepContent(finish)
    expect(screen.getByText((c) => c.includes('No critical alerts right now.'))).toBeInTheDocument()
  })

  it('INSTRUCTOR: grading step shows pending count when > 0', () => {
    const steps = getSteps('INSTRUCTOR', { pendingGrading: 7 })
    const gradingStep = steps.find((s) => s.target === '[data-tour-id="nav-grading"]')
    expect(gradingStep).toBeDefined()
    renderStepContent(gradingStep!)
    expect(screen.getByText('7 submissions pending')).toBeInTheDocument()
  })

  it('INSTRUCTOR: grading step shows singular form for 1 pending', () => {
    const steps = getSteps('INSTRUCTOR', { pendingGrading: 1 })
    const gradingStep = steps.find((s) => s.target === '[data-tour-id="nav-grading"]')
    expect(gradingStep).toBeDefined()
    renderStepContent(gradingStep!)
    expect(screen.getByText('1 submission pending')).toBeInTheDocument()
  })

  it('INSTRUCTOR: grading step hides count when 0', () => {
    const steps = getSteps('INSTRUCTOR', { pendingGrading: 0 })
    const gradingStep = steps.find((s) => s.target === '[data-tour-id="nav-grading"]')
    expect(gradingStep).toBeDefined()
    renderStepContent(gradingStep!)
    expect(screen.queryByText(/pending/)).not.toBeInTheDocument()
  })

  it('EXAMINER: finish step includes pending exam report count', () => {
    const steps = getSteps('EXAMINER', { pendingExamReports: 3 })
    const finish = steps[steps.length - 1]
    renderStepContent(finish)
    expect(screen.getByText(/Pending exam reports awaiting your review: 3/)).toBeInTheDocument()
  })

  it('APPLICANT: dashboard step shows application stage', () => {
    const steps = getSteps('APPLICANT', { applicationStage: 'SHORTLISTED' })
    const dashboardStep = steps.find((s) => s.target === '[data-tour-id="nav-dashboard"]')
    expect(dashboardStep).toBeDefined()
    renderStepContent(dashboardStep!)
    expect(screen.getByText((c) => c.includes('Current stage: SHORTLISTED'))).toBeInTheDocument()
  })

  it('APPLICANT: dashboard step shows fallback when no stage', () => {
    const steps = getSteps('APPLICANT', { applicationStage: null })
    const dashboardStep = steps.find((s) => s.target === '[data-tour-id="nav-dashboard"]')
    expect(dashboardStep).toBeDefined()
    renderStepContent(dashboardStep!)
    expect(screen.getByText(/Check the sidebar for your current step/)).toBeInTheDocument()
  })

  it('APPLICANT: wallet step shows balance when provided', () => {
    const steps = getSteps('APPLICANT', {
      walletBalance: { available: 500, currency: 'EUR' },
      applicationStage: 'PAYMENT_VERIFIED',
    })
    const walletStep = steps.find((s) => s.target === '[data-tour-id="nav-wallet"]')
    expect(walletStep).toBeDefined()
    renderStepContent(walletStep!)
    expect(screen.getByText('Balance: EUR 500')).toBeInTheDocument()
  })
})

/* ------------------------------------------------------------------ */
/*  filterLiveSteps — visibility gating                              */
/* ------------------------------------------------------------------ */
describe('filterLiveSteps', () => {
  const makeStep = (target: string): Step => ({
    target,
    content: <div>test</div>,
    placement: 'right',
  })

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('always keeps body-targeted steps', () => {
    const steps = [makeStep('body'), makeStep('#missing')]
    const filtered = filterLiveSteps(steps)
    expect(filtered).toHaveLength(1)
    expect(filtered[0].target).toBe('body')
  })

  it('drops steps whose target element is absent from DOM', () => {
    const steps = [makeStep('#present'), makeStep('#absent')]
    document.body.innerHTML = '<div id="present">x</div>'
    const filtered = filterLiveSteps(steps)
    expect(filtered.map((s) => s.target)).toEqual(['#present'])
  })

  it('drops steps whose target is display:none', () => {
    const steps = [makeStep('#hidden')]
    document.body.innerHTML = '<div id="hidden" style="display:none">x</div>'
    const filtered = filterLiveSteps(steps)
    expect(filtered).toHaveLength(0)
  })

  it('keeps steps whose target is visible (display:block)', () => {
    const steps = [makeStep('#visible')]
    document.body.innerHTML = '<div id="visible">x</div>'
    const filtered = filterLiveSteps(steps)
    expect(filtered).toHaveLength(1)
  })

  it('handles invalid selectors gracefully', () => {
    const steps = [makeStep(':::invalid')]
    const filtered = filterLiveSteps(steps)
    // Should not throw — returns original steps (true) on querySelector failure
    expect(filtered).toHaveLength(1)
  })

  it('does not mutate the original array', () => {
    const steps = [makeStep('body'), makeStep('#absent')]
    const original = steps.length
    filterLiveSteps(steps)
    expect(steps).toHaveLength(original)
  })
})

/* ------------------------------------------------------------------ */
/*  getSteps — placement conventions                                  */
/* ------------------------------------------------------------------ */
describe('getSteps — placement conventions', () => {
  it('sidebar targets use placement right', () => {
    const roles = ['STUDENT', 'STAFF', 'INSTRUCTOR', 'EXAMINER', 'APPLICANT']
    roles.forEach((role) => {
      const steps = getSteps(role, {})
      steps.forEach((s) => {
        const t = typeof s.target === 'string' ? s.target : ''
        if (t.startsWith('[data-tour-id="group-') || t.startsWith('[data-tour-id="nav-')) {
          expect(s.placement).toBe('right')
        }
      })
    })
  })

  it('topbar targets use placement bottom', () => {
    const staffSteps = getSteps('STAFF', {})
    const topbarStep = staffSteps.find((s) => s.target === '[data-tour-id="topbar-notifications"]')
    expect(topbarStep?.placement).toBe('bottom')
  })

  it('tour trigger uses placement bottom', () => {
    const steps = getSteps('STUDENT', {})
    const triggerStep = steps.find((s) => s.target === '[data-tour-id="topbar-tour-trigger"]')
    expect(triggerStep?.placement).toBe('bottom')
  })
})
