import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PDFBaseTemplate } from '@/components/pdf/PDFBaseTemplate'
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

describe('PDFBaseTemplate', () => {
  it('renders without crashing', () => {
    render(
      <PDFBaseTemplate title="Test Document">
        <div>Content</div>
      </PDFBaseTemplate>
    )
    expect(screen.getByText('Test Document')).toBeInTheDocument()
  })

  it('renders academy name by default', () => {
    render(
      <PDFBaseTemplate title="Test">
        <div>Content</div>
      </PDFBaseTemplate>
    )
    expect(screen.getAllByText('Aerojet Aviation Training Academy').length).toBeGreaterThan(0)
  })

  it('renders children content', () => {
    render(
      <PDFBaseTemplate title="Test">
        <div>PDF Body Content</div>
      </PDFBaseTemplate>
    )
    expect(screen.getByText('PDF Body Content')).toBeInTheDocument()
  })

  it('renders custom academy name', () => {
    render(
      <PDFBaseTemplate title="Test" academyName="Custom Academy">
        <div>Content</div>
      </PDFBaseTemplate>
    )
    expect(screen.getByText('Custom Academy')).toBeInTheDocument()
  })
})
