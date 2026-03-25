import type { Meta, StoryObj } from '@storybook/react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Shared/LoadingSpinner',
  component: LoadingSpinner,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'default', 'lg'] },
  },
}
export default meta
type Story = StoryObj<typeof LoadingSpinner>

export const Default: Story = { args: {} }
export const Small: Story = { args: { size: 'sm' } }
export const Large: Story = { args: { size: 'lg' } }

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <LoadingSpinner size="sm" />
      <LoadingSpinner size="default" />
      <LoadingSpinner size="lg" />
    </div>
  ),
}
