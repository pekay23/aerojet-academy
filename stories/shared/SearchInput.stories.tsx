import type { Meta, StoryObj } from '@storybook/react'
import { Search } from 'lucide-react'

const meta: Meta = {
  title: 'Shared/SearchInput',
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj

// SearchInput uses next/navigation hooks, so we render a visual-only version
export const Default: Story = {
  render: () => (
    <div className="relative w-75">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="Search students..."
        className="focus:border-aerojet-blue focus:ring-aerojet-blue h-10 w-full rounded-xl border border-slate-200 pr-4 pl-10 text-sm focus:ring-1 focus:outline-none"
      />
    </div>
  ),
}

export const WithValue: Story = {
  render: () => (
    <div className="relative w-75">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        defaultValue="John Doe"
        className="focus:border-aerojet-blue focus:ring-aerojet-blue h-10 w-full rounded-xl border border-slate-200 pr-4 pl-10 text-sm focus:ring-1 focus:outline-none"
      />
    </div>
  ),
}
