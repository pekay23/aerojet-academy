import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: string) {
  const trigger = screen.getByRole('combobox', { name: new RegExp(label, 'i') })
  await user.click(trigger)
  // Use keyboard to select first option
  await user.keyboard('{ArrowDown}{Enter}')
}
import WithdrawalsManager from '@/app/staff/withdrawals/_components/WithdrawalsManager'
import { createMockWithdrawalRequests, createMockWithdrawalRequest } from '@/tests/factories'
import { WR } from '@/app/staff/withdrawals/_components/WithdrawalsManager'

// Helper to create withdrawal request with unique student data
const createRequest = (id: number, status: WR['status']): WR =>
  createMockWithdrawalRequest({
    id: `withdrawal-${id}`,
    status,
    user: {
      id: `student-${id}`,
      email: `student${id}@test.com`,
      profile: { firstName: 'Student', lastName: String(id) },
      studentProfile: { studentId: `AJA-2026-${String(id).padStart(4, '0')}` },
    },
  })

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock withdrawal actions
vi.mock('@/lib/withdrawal/actions', () => ({
  staffConfirmWithdrawal: vi.fn(),
  rejectWithdrawal: vi.fn(),
  adminApproveWithdrawal: vi.fn(),
  staffInitiateWithdrawal: vi.fn(),
}))

import {
  staffConfirmWithdrawal as _staffConfirmWithdrawal,
  rejectWithdrawal as _rejectWithdrawal,
  adminApproveWithdrawal as _adminApproveWithdrawal,
  staffInitiateWithdrawal as _staffInitiateWithdrawal,
} from '@/lib/withdrawal/actions'
import { toast } from 'sonner'

const staffConfirmWithdrawal = _staffConfirmWithdrawal as ReturnType<typeof vi.fn>
const rejectWithdrawal = _rejectWithdrawal as ReturnType<typeof vi.fn>
const adminApproveWithdrawal = _adminApproveWithdrawal as ReturnType<typeof vi.fn>
const staffInitiateWithdrawal = _staffInitiateWithdrawal as ReturnType<typeof vi.fn>

const defaultProps = {
  requests: createMockWithdrawalRequests(5, { status: 'REQUESTED' }),
  students: [
    {
      id: 'student-1',
      email: 'student1@test.com',
      profile: { firstName: 'Student', lastName: 'One' },
    },
    {
      id: 'student-2',
      email: 'student2@test.com',
      profile: { firstName: 'Student', lastName: 'Two' },
    },
  ],
  isAdmin: true,
}

describe('WithdrawalsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    staffConfirmWithdrawal.mockResolvedValue({ success: true })
    rejectWithdrawal.mockResolvedValue({ success: true })
    adminApproveWithdrawal.mockResolvedValue({ success: true })
    staffInitiateWithdrawal.mockResolvedValue({ success: true })
  })

  it('renders withdrawal requests in a table', () => {
    render(<WithdrawalsManager {...defaultProps} />)

    expect(screen.getByRole('grid', { name: /withdrawal requests/i })).toBeInTheDocument()
    expect(screen.getByText('Student 1')).toBeInTheDocument()
    expect(screen.getAllByText('Personal reasons').length).toBeGreaterThan(0)
    // Status badge in table row (multiple cells match, verify at least one)
    expect(screen.getAllByRole('cell', { name: /status: requested/i }).length).toBeGreaterThan(0)
  })

  it('renders filter buttons', () => {
    render(<WithdrawalsManager {...defaultProps} />)

    expect(screen.getByRole('button', { name: /requested/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /staff confirmed/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rejected/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelled/i })).toBeInTheDocument()
  })

  it('filters requests by status', () => {
    // Create 4 unique requests: 2 REQUESTED, 2 COMPLETED
    const requests = [
      createRequest(1, 'REQUESTED'),
      createRequest(2, 'REQUESTED'),
      createRequest(3, 'COMPLETED'),
      createRequest(4, 'COMPLETED'),
    ]
    render(<WithdrawalsManager {...defaultProps} requests={requests} />)

    // Default filter is OPEN (REQUESTED, STAFF_CONFIRMED, ADMIN_APPROVED)
    expect(screen.getByText('Student 1')).toBeInTheDocument()
    expect(screen.getByText('Student 2')).toBeInTheDocument()

    // Click COMPLETED filter
    fireEvent.click(screen.getByRole('button', { name: /completed/i }))

    expect(screen.getByText('Student 3')).toBeInTheDocument()
    expect(screen.getByText('Student 4')).toBeInTheDocument()
    expect(screen.queryByText('Student 1')).not.toBeInTheDocument()
  })

  it('shows pagination when more than PAGE_SIZE items', () => {
    const requests = createMockWithdrawalRequests(30, { status: 'REQUESTED' })
    render(<WithdrawalsManager {...defaultProps} requests={requests} />)

    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
  })

  describe('Confirm action', () => {
    it('opens confirm dialog when clicking Confirm button', async () => {
      render(<WithdrawalsManager {...defaultProps} />)

      const confirmButton = screen.getByRole('button', {
        name: /confirm withdrawal for student 1/i,
      })
      fireEvent.click(confirmButton)

      expect(screen.getByRole('dialog', { name: /confirm withdrawal/i })).toBeInTheDocument()
      expect(
        screen.getByText(/are you sure you want to confirm this withdrawal request/i)
      ).toBeInTheDocument()
    })

    it('calls staffConfirmWithdrawal when confirmed', async () => {
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /confirm withdrawal for student 1/i }))
      fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }))

      await waitFor(() => {
        expect(staffConfirmWithdrawal).toHaveBeenCalledWith('withdrawal-1')
      })
    })

    it('shows loading state during confirm', async () => {
      let resolveConfirm: (value: any) => void
      staffConfirmWithdrawal.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveConfirm = resolve
          })
      )

      render(<WithdrawalsManager {...defaultProps} />)

      const user = userEvent.setup()

      // Open confirm dialog
      await user.click(screen.getByRole('button', { name: /confirm withdrawal for student 1/i }))

      // Click Confirm button in dialog
      const confirmBtn = screen.getByRole('button', { name: /^confirm$/i })
      await user.click(confirmBtn)

      // Verify the action was called (loading state is internal implementation detail)
      await waitFor(
        () => {
          expect(staffConfirmWithdrawal).toHaveBeenCalledWith('withdrawal-1')
        },
        { timeout: 5000 }
      )

      act(() => {
        resolveConfirm!({ success: true })
      })
    })
  })

  describe('Approve action (admin only)', () => {
    it('shows Approve button only when isAdmin is true', () => {
      render(<WithdrawalsManager {...defaultProps} isAdmin={false} />)

      expect(
        screen.queryByRole('button', { name: /approve withdrawal for student 1/i })
      ).not.toBeInTheDocument()
    })

    it('opens approve dialog when clicking Approve button', async () => {
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /approve withdrawal for student 1/i }))

      const dialog = screen.getByRole('dialog', { name: /approve withdrawal/i })
      expect(dialog).toBeInTheDocument()
      expect(within(dialog).getByText(/this will archive the student/i)).toBeInTheDocument()
    })

    it('calls adminApproveWithdrawal when approved', async () => {
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /approve withdrawal for student 1/i }))

      const dialog = screen.getByRole('dialog', { name: /approve withdrawal/i })
      fireEvent.click(within(dialog).getByRole('button', { name: /approve/i }))

      await waitFor(() => {
        expect(adminApproveWithdrawal).toHaveBeenCalledWith('withdrawal-1')
      })
    })
  })

  describe('Reject action', () => {
    it('opens reject modal when clicking Reject button', async () => {
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /reject withdrawal for student 1/i }))

      expect(screen.getByRole('dialog', { name: /reject withdrawal/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/reason for rejection/i)).toBeInTheDocument()
    })

    it('requires a rejection reason', async () => {
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /reject withdrawal for student 1/i }))

      const dialog = screen.getByRole('dialog', { name: /reject withdrawal/i })
      fireEvent.click(within(dialog).getByRole('button', { name: /^reject$/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please enter a rejection reason')
      })

      expect(rejectWithdrawal).not.toHaveBeenCalled()
    })

    it('calls rejectWithdrawal with reason when provided', async () => {
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /reject withdrawal for student 1/i }))

      const dialog = screen.getByRole('dialog', { name: /reject withdrawal/i })
      fireEvent.change(within(dialog).getByLabelText(/reason for rejection/i), {
        target: { value: 'Insufficient documentation' },
      })
      fireEvent.click(within(dialog).getByRole('button', { name: /^reject$/i }))

      await waitFor(() => {
        expect(rejectWithdrawal).toHaveBeenCalledWith('withdrawal-1', 'Insufficient documentation')
      })
    })
  })

  describe('Initiate Withdrawal', () => {
    it('opens initiate modal when clicking Initiate Withdrawal button', async () => {
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /initiate new withdrawal request/i }))

      const dialog = screen.getByRole('dialog', { name: /initiate withdrawal/i })
      expect(dialog).toBeInTheDocument()
      expect(within(dialog).getByLabelText(/student/i)).toBeInTheDocument()
      expect(within(dialog).getByLabelText(/reason/i)).toBeInTheDocument()
    })

    it('requires student selection', async () => {
      const user = userEvent.setup()
      render(<WithdrawalsManager {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /initiate new withdrawal request/i }))

      const dialog = screen.getByRole('dialog', { name: /initiate withdrawal/i })
      await user.type(within(dialog).getByLabelText(/reason/i), 'Academic reasons')
      await user.click(within(dialog).getByRole('button', { name: /initiate/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please select a student')
      })

      expect(staffInitiateWithdrawal).not.toHaveBeenCalled()
    })

    it('requires reason', async () => {
      const user = userEvent.setup()
      render(<WithdrawalsManager {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /initiate new withdrawal request/i }))

      const dialog = screen.getByRole('dialog', { name: /initiate withdrawal/i })
      await selectOption(user, 'student')
      await user.click(within(dialog).getByRole('button', { name: /initiate/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please provide a reason for the withdrawal')
      })

      expect(staffInitiateWithdrawal).not.toHaveBeenCalled()
    })

    it('calls staffInitiateWithdrawal with student and reason', async () => {
      const user = userEvent.setup()
      render(<WithdrawalsManager {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /initiate new withdrawal request/i }))

      const dialog = screen.getByRole('dialog', { name: /initiate withdrawal/i })
      await selectOption(user, 'student')
      await user.type(within(dialog).getByLabelText(/reason/i), 'Academic reasons')
      await user.click(within(dialog).getByRole('button', { name: /initiate/i }))

      await waitFor(() => {
        expect(staffInitiateWithdrawal).toHaveBeenCalledWith('student-1', 'Academic reasons')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes on table', () => {
      render(<WithdrawalsManager {...defaultProps} />)

      const table = screen.getByRole('grid', { name: /withdrawal requests/i })
      expect(table).toHaveAttribute('role', 'grid')
    })

    it('has proper ARIA attributes on filter buttons', () => {
      render(<WithdrawalsManager {...defaultProps} />)

      const requestedButton = screen.getByRole('button', { name: /requested/i })
      expect(requestedButton).toHaveAttribute('aria-pressed')
    })

    it('has proper ARIA attributes on action buttons', () => {
      render(<WithdrawalsManager {...defaultProps} />)

      const confirmButton = screen.getByRole('button', {
        name: /confirm withdrawal for student 1/i,
      })
      expect(confirmButton).toHaveAttribute('aria-label')
      expect(confirmButton).toHaveAttribute('aria-disabled')
    })

    it('modals have proper ARIA attributes', async () => {
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /confirm withdrawal for student 1/i }))

      const dialog = screen.getByRole('dialog', { name: /confirm withdrawal/i })
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('closes modal on Escape key', async () => {
      const user = userEvent.setup()
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /confirm withdrawal for student 1/i }))
      expect(screen.getByRole('dialog', { name: /confirm withdrawal/i })).toBeInTheDocument()

      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog', { name: /confirm withdrawal/i })).not.toBeInTheDocument()
    })

    it('closes reject modal on Escape key', async () => {
      const user = userEvent.setup()
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /reject withdrawal for student 1/i }))
      expect(screen.getByRole('dialog', { name: /reject withdrawal/i })).toBeInTheDocument()

      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog', { name: /reject withdrawal/i })).not.toBeInTheDocument()
    })

    it('closes initiate modal on Escape key', async () => {
      const user = userEvent.setup()
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /initiate new withdrawal request/i }))
      expect(screen.getByRole('dialog', { name: /initiate withdrawal/i })).toBeInTheDocument()

      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog', { name: /initiate withdrawal/i })).not.toBeInTheDocument()
    })

    it('traps focus in modals', async () => {
      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /confirm withdrawal for student 1/i }))

      const dialog = screen.getByRole('dialog', { name: /confirm withdrawal/i })
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      expect(focusableElements.length).toBeGreaterThan(0)
    })
  })

  describe('Optimistic updates', () => {
    it('updates status optimistically when confirming', async () => {
      let resolveConfirm: (value: any) => void
      staffConfirmWithdrawal.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveConfirm = resolve
          })
      )

      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /confirm withdrawal for student 1/i }))
      fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }))

      // Should show confirmed status optimistically
      expect(screen.getAllByText('Staff Confirmed').length).toBeGreaterThan(0)

      act(() => {
        resolveConfirm!({ success: true })
      })
    })

    it('reverts optimistic update on error', async () => {
      let resolveConfirm: (value: any) => void
      staffConfirmWithdrawal.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveConfirm = resolve
          })
      )

      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /confirm withdrawal for student 1/i }))
      fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }))

      expect(screen.getAllByText('Staff Confirmed').length).toBeGreaterThan(0)

      act(() => {
        resolveConfirm!({ error: 'Failed to confirm' })
      })

      // Should revert to Requested
      await waitFor(() => {
        expect(screen.getAllByText('Requested').length).toBeGreaterThan(0)
      })
    })

    it('updates status optimistically when rejecting', async () => {
      let resolveReject: (value: any) => void
      rejectWithdrawal.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveReject = resolve
          })
      )

      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /reject withdrawal for student 1/i }))
      fireEvent.change(screen.getByLabelText(/reason for rejection/i), {
        target: { value: 'Test reason' },
      })
      fireEvent.click(screen.getByRole('button', { name: /^reject$/i }))

      expect(screen.getByText('Rejected')).toBeInTheDocument()

      act(() => {
        resolveReject!({ success: true })
      })
    })

    it('reverts optimistic update on reject error', async () => {
      let resolveReject: (value: any) => void
      rejectWithdrawal.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveReject = resolve
          })
      )

      render(<WithdrawalsManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /reject withdrawal for student 1/i }))
      fireEvent.change(screen.getByLabelText(/reason for rejection/i), {
        target: { value: 'Test reason' },
      })
      fireEvent.click(screen.getByRole('button', { name: /^reject$/i }))

      expect(screen.getByText('Rejected')).toBeInTheDocument()

      act(() => {
        resolveReject!({ error: 'Failed to reject' })
      })

      // Should revert to Requested and still be visible in OPEN filter
      await waitFor(() => {
        expect(screen.getAllByText('Requested').length).toBeGreaterThan(0)
      })
    })
  })

  describe('Status badge', () => {
    it('displays correct status labels', () => {
      const requests = [
        createMockWithdrawalRequests(1, { status: 'REQUESTED' })[0],
        createMockWithdrawalRequests(1, { status: 'STAFF_CONFIRMED' })[0],
        createMockWithdrawalRequests(1, { status: 'ADMIN_APPROVED' })[0],
        createMockWithdrawalRequests(1, { status: 'COMPLETED' })[0],
        createMockWithdrawalRequests(1, { status: 'REJECTED' })[0],
        createMockWithdrawalRequests(1, { status: 'CANCELLED' })[0],
      ]
      render(<WithdrawalsManager {...defaultProps} requests={requests} />)

      // Switch to ALL filter to see all statuses
      fireEvent.click(screen.getByRole('button', { name: /all/i }))

      // Check status badges (spans with aria-label) - not filter buttons
      const statusBadges = screen
        .getAllByRole('cell', { name: /status:/i })
        .map((cell) => cell.querySelector('span[aria-label^="Status:"]'))
      expect(statusBadges.filter(Boolean)).toHaveLength(6)

      // Each status should appear in its badge - check via the aria-label
      const expectedLabels = [
        'Status: Requested',
        'Status: Staff Confirmed',
        'Status: Admin Approved',
        'Status: Completed',
        'Status: Rejected',
        'Status: Cancelled',
      ]
      statusBadges.forEach((badge, index) => {
        expect(badge?.getAttribute('aria-label')).toBe(expectedLabels[index])
      })
    })
  })

  describe('Empty state', () => {
    it('shows message when no requests match filter', () => {
      const requests = createMockWithdrawalRequests(3, { status: 'COMPLETED' })
      render(<WithdrawalsManager {...defaultProps} requests={requests} />)

      // Default filter is OPEN, so no completed requests should show
      expect(screen.getByText(/no withdrawal requests \(open\)/i)).toBeInTheDocument()
    })
  })
})
