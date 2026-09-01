import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InvoiceTemplate } from '@/components/pdf/templates/InvoiceTemplate'

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: any) => <div>{children}</div>,
  Page: ({ children }: any) => <div>{children}</div>,
  View: ({ children }: any) => <div>{children}</div>,
  Text: ({ children }: any) => <span>{children}</span>,
  Image: (props: any) => <img {...props} />,
  StyleSheet: { create: () => ({}) },
}))

vi.mock('date-fns', () => ({
  format: (date: Date, fmt: string) => {
    if (fmt === 'dd MMM yyyy') return '15 Jan 2025'
    return date.toString()
  },
}))

describe('InvoiceTemplate', () => {
  const defaultProps = {
    invoiceNumber: 'INV-001',
    date: new Date('2025-01-15'),
    dueDate: new Date('2025-02-15'),
    studentName: 'John Doe',
    studentEmail: 'john@example.com',
    items: [{ description: 'Course Fee', quantity: 1, unitPrice: 500, total: 500 }],
    subtotal: 500,
    total: 500,
  }

  it('renders without crashing', () => {
    render(<InvoiceTemplate {...defaultProps} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders invoice number', () => {
    render(<InvoiceTemplate {...defaultProps} />)
    expect(screen.getByText('INV-001')).toBeInTheDocument()
  })

  it('renders student email', () => {
    render(<InvoiceTemplate {...defaultProps} />)
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('renders line items', () => {
    render(<InvoiceTemplate {...defaultProps} />)
    expect(screen.getByText('Course Fee')).toBeInTheDocument()
  })

  it('renders total due', () => {
    render(<InvoiceTemplate {...defaultProps} />)
    expect(screen.getByText('Total Due')).toBeInTheDocument()
  })

  it('renders student ID when provided', () => {
    render(<InvoiceTemplate {...defaultProps} studentId="STU001" />)
    expect(screen.getByText('Student ID: STU001')).toBeInTheDocument()
  })
})
