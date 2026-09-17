import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

vi.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  List: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

describe('Tabs', () => {
  it('renders without crashing', () => {
    render(
      <Tabs>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )
    expect(screen.getByText('Tab 1')).toBeInTheDocument()
  })

  it('renders multiple triggers', () => {
    render(
      <Tabs>
        <TabsList>
          <TabsTrigger value="tab1">First</TabsTrigger>
          <TabsTrigger value="tab2">Second</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <Tabs className="custom-tabs">
        <TabsList>
          <TabsTrigger value="tab1">Tab</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    expect(document.querySelector('.custom-tabs')).toBeTruthy()
  })
})
