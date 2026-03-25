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
    <div className="relative w-[300px]">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="Search students..."
        className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm focus:border-aerojet-blue focus:outline-none focus:ring-1 focus:ring-aerojet-blue"
      />
    </div>
  ),
}

export const WithValue: Story = {
  render: () => (
    <div className="relative w-[300px]">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        defaultValue="John Doe"
        className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm focus:border-aerojet-blue focus:outline-none focus:ring-1 focus:ring-aerojet-blue"
      />
    </div>
  ),
}
