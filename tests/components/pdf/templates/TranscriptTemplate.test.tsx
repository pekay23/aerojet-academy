import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TranscriptTemplate } from '@/components/pdf/templates/TranscriptTemplate'
import type React from 'react'

type MockImageProps = React.ComponentProps<'img'>
type MockChildrenProps = React.PropsWithChildren

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: MockChildrenProps) => <div>{children}</div>,
  Page: ({ children }: MockChildrenProps) => <div>{children}</div>,
  View: ({ children }: MockChildrenProps) => <div>{children}</div>,
  Text: ({ children }: MockChildrenProps) => <span>{children}</span>,
  Image: (props: MockImageProps) => {
    const MockImage = 'img'
    return <MockImage alt="" {...props} />
  },
  StyleSheet: { create: () => ({}) },
}))

describe('TranscriptTemplate', () => {
  const defaultProps = {
    studentName: 'John Doe',
    studentId: 'STU001',
    enrollmentDate: 'January 2024',
    programName: 'EASA Part-66 B1.1',
    records: [
      { code: 'MOD01', courseName: 'Mathematics', credits: 3, grade: 'A', status: 'Pass' as const },
      { code: 'MOD02', courseName: 'Physics', credits: 4, grade: 'B', status: 'Pass' as const },
    ],
  }

  it('renders without crashing', () => {
    render(<TranscriptTemplate {...defaultProps} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders student name', () => {
    render(<TranscriptTemplate {...defaultProps} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders student ID', () => {
    render(<TranscriptTemplate {...defaultProps} />)
    expect(screen.getByText('STU001')).toBeInTheDocument()
  })

  it('renders program name', () => {
    render(<TranscriptTemplate {...defaultProps} />)
    expect(screen.getByText('EASA Part-66 B1.1')).toBeInTheDocument()
  })

  it('renders course records', () => {
    render(<TranscriptTemplate {...defaultProps} />)
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('Physics')).toBeInTheDocument()
  })

  it('renders status badges', () => {
    render(<TranscriptTemplate {...defaultProps} />)
    const passElements = screen.getAllByText('Pass')
    expect(passElements.length).toBeGreaterThanOrEqual(2)
  })

  it('renders generated date when provided', () => {
    render(<TranscriptTemplate {...defaultProps} generatedDate="January 15, 2025" />)
    expect(screen.getByText('January 15, 2025')).toBeInTheDocument()
  })
})
