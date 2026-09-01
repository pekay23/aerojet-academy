import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExamStatusBadge, getExamStatusConfig } from '@/components/shared/ExamStatusBadge'

describe('ExamStatusBadge', () => {
  it('renders booking status APPROVED with correct label and class', () => {
    const { container } = render(<ExamStatusBadge status="APPROVED" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('bg-emerald-50')
    expect(container.firstChild).toHaveClass('text-emerald-600')
  })

  it('renders payment status PENDING with correct label and class', () => {
    const { container } = render(<ExamStatusBadge status="PENDING" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('bg-amber-50')
    expect(container.firstChild).toHaveClass('text-amber-600')
  })

  it('renders result status PASS with correct label and class', () => {
    const { container } = render(<ExamStatusBadge status="PASS" />)
    expect(screen.getByText('Pass')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('bg-emerald-100')
    expect(container.firstChild).toHaveClass('text-emerald-700')
  })

  it('renders result status FAIL with correct label and class', () => {
    const { container } = render(<ExamStatusBadge status="FAIL" />)
    expect(screen.getByText('Fail')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('bg-red-100')
    expect(container.firstChild).toHaveClass('text-red-700')
  })

  it('renders visual status CONFIRMED with correct label and class', () => {
    const { container } = render(<ExamStatusBadge status="CONFIRMED" />)
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('bg-green-100')
    expect(container.firstChild).toHaveClass('text-green-700')
  })

  it('renders visual status ROLLED with custom label', () => {
    render(<ExamStatusBadge status="ROLLED" />)
    expect(screen.getByText('Rolled Forward')).toBeInTheDocument()
  })

  it('renders unknown status with default gray class', () => {
    const { container } = render(<ExamStatusBadge status="UNKNOWN" />)
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('bg-slate-100')
    expect(container.firstChild).toHaveClass('text-slate-600')
  })

  it('merges custom className', () => {
    const { container } = render(<ExamStatusBadge status="APPROVED" className="ml-2" />)
    expect(container.firstChild).toHaveClass('ml-2')
    expect(container.firstChild).toHaveClass('bg-emerald-50')
  })

  it('applies sm size classes', () => {
    const { container } = render(<ExamStatusBadge status="PASS" size="sm" />)
    expect(container.firstChild).toHaveClass('text-[10px]')
    expect(container.firstChild).toHaveClass('rounded-md')
  })

  it('applies md size classes by default', () => {
    const { container } = render(<ExamStatusBadge status="PASS" />)
    expect(container.firstChild).toHaveClass('rounded-full')
    expect(container.firstChild).toHaveClass('text-xs')
  })

  it('hides icon when showIcon is false', () => {
    const { container } = render(<ExamStatusBadge status="APPROVED" showIcon={false} />)
    const icon = container.querySelector('svg')
    expect(icon).toBeNull()
  })
})

describe('getExamStatusConfig', () => {
  it('returns correct config for known booking statuses', () => {
    const config = getExamStatusConfig('APPROVED')
    expect(config.label).toBe('Approved')
    expect(config.variant).toBe('booking')
    expect(config.className).toContain('bg-emerald-50')
  })

  it('returns correct config for known payment statuses', () => {
    const config = getExamStatusConfig('APPROVED')
    expect(config.label).toBe('Approved')
    expect(config.variant).toBe('booking')
    expect(config.className).toContain('bg-emerald-50')
  })

  it('returns correct config for known result statuses', () => {
    const config = getExamStatusConfig('SCHEDULED')
    expect(config.label).toBe('Scheduled')
    expect(config.variant).toBe('result')
    expect(config.className).toContain('bg-cyan-100')
  })

  it('returns correct config for known visual statuses', () => {
    const config = getExamStatusConfig('RESERVED')
    expect(config.label).toBe('Pending Confirmation')
    expect(config.variant).toBe('visual')
    expect(config.className).toContain('bg-blue-100')
  })

  it('returns default config for unknown statuses', () => {
    const config = getExamStatusConfig('UNKNOWN_STATUS')
    expect(config.label).toBe('UNKNOWN STATUS')
    expect(config.variant).toBe('booking')
    expect(config.className).toContain('bg-slate-100')
  })
})
