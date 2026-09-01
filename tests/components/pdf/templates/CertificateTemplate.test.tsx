import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CertificateTemplate } from '@/components/pdf/templates/CertificateTemplate'

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: any) => <div>{children}</div>,
  Page: ({ children }: any) => <div>{children}</div>,
  View: ({ children }: any) => <div>{children}</div>,
  Text: ({ children }: any) => <span>{children}</span>,
  Image: (props: any) => <img {...props} />,
  StyleSheet: { create: () => ({}) },
}))

describe('CertificateTemplate', () => {
  const defaultProps = {
    studentName: 'John Doe',
    programName: 'EASA Part-66 B1.1',
    issueDate: 'January 15, 2025',
    certificateNumber: 'CERT-2025-089',
  }

  it('renders without crashing', () => {
    render(<CertificateTemplate {...defaultProps} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders student name', () => {
    render(<CertificateTemplate {...defaultProps} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders program name', () => {
    render(<CertificateTemplate {...defaultProps} />)
    expect(screen.getByText('EASA Part-66 B1.1')).toBeInTheDocument()
  })

  it('renders certificate number', () => {
    render(<CertificateTemplate {...defaultProps} />)
    expect(screen.getByText('Certificate No. CERT-2025-089')).toBeInTheDocument()
  })

  it('renders issue date', () => {
    render(<CertificateTemplate {...defaultProps} />)
    expect(screen.getByText('Issued on January 15, 2025')).toBeInTheDocument()
  })

  it('renders certificate title', () => {
    render(<CertificateTemplate {...defaultProps} />)
    expect(screen.getByText('Certificate of Completion')).toBeInTheDocument()
  })

  it('renders module code when provided', () => {
    render(<CertificateTemplate {...defaultProps} moduleCode="M01" />)
    expect(screen.getByText('Module: M01')).toBeInTheDocument()
  })

  it('renders pass badge when percentage >= passMarkPct', () => {
    render(
      <CertificateTemplate
        {...defaultProps}
        percentage={90}
        passMarkPct={75}
      />
    )
    expect(screen.getByText('PASSED')).toBeInTheDocument()
  })

  it('does not render pass badge when percentage < passMarkPct', () => {
    render(
      <CertificateTemplate
        {...defaultProps}
        percentage={60}
        passMarkPct={75}
      />
    )
    expect(screen.queryByText('PASSED')).not.toBeInTheDocument()
  })

  it('renders score and points when provided', () => {
    render(
      <CertificateTemplate
        {...defaultProps}
        score={36}
        totalPoints={40}
        percentage={90}
        passMarkPct={75}
      />
    )
    expect(screen.getByText('90.0%')).toBeInTheDocument()
    expect(screen.getByText('36/40')).toBeInTheDocument()
  })
})
