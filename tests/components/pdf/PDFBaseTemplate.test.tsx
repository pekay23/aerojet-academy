import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PDFBaseTemplate } from '@/components/pdf/PDFBaseTemplate'

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: any) => <div>{children}</div>,
  Page: ({ children }: any) => <div>{children}</div>,
  View: ({ children }: any) => <div>{children}</div>,
  Text: ({ children }: any) => <span>{children}</span>,
  Image: (props: any) => <img {...props} />,
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
