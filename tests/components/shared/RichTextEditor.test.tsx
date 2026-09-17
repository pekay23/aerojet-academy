import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RichTextEditor from '@/components/shared/RichTextEditor'

vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: (_loader: any) => {
    const Component = (props: any) => <div data-testid="rich-text-editor">{props.content}</div>
    Component.preload = vi.fn()
    return Component
  },
}))

describe('RichTextEditor', () => {
  it('renders without crashing', () => {
    render(<RichTextEditor content="" onChange={vi.fn()} />)
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument()
  })

  it('passes content prop', () => {
    render(<RichTextEditor content="<p>Hello</p>" onChange={vi.fn()} />)
    expect(screen.getByTestId('rich-text-editor').textContent).toBe('<p>Hello</p>')
  })
})
