import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from '@/components/ui/skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  render: () => <Skeleton className="h-4 w-62.5" />,
}

export const TextBlock: Story = {
  render: () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-62.5" />
      <Skeleton className="h-4 w-50" />
      <Skeleton className="h-4 w-37.5" />
    </div>
  ),
}

export const Avatar: Story = {
  render: () => <Skeleton className="h-12 w-12 rounded-full" />,
}

export const CardLayout: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-62.5" />
        <Skeleton className="h-4 w-50" />
      </div>
    </div>
  ),
}
