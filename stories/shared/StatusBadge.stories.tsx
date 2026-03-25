import type { Meta, StoryObj } from '@storybook/react'
import { StatusBadge } from '@/components/shared/StatusBadge'

const meta: Meta<typeof StatusBadge> = {
  title: 'Shared/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['ACTIVE', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ENROLLED', 'COMPLETED', 'DRAFT', 'GO', 'NO_GO', 'CONFIRMED', 'FAILED', 'CANCELLED', 'RESERVED', 'REFUNDED', 'OPEN', 'NEAR_FULL', 'LOCKED', 'PUBLISHED'],
    },
  },
}
export default meta
type Story = StoryObj<typeof StatusBadge>

export const Active: Story = { args: { status: 'ACTIVE' } }
export const Pending: Story = { args: { status: 'PENDING' } }
export const Rejected: Story = { args: { status: 'REJECTED' } }

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {['ACTIVE', 'PENDING', 'PAYMENT_PENDING', 'PAYMENT_REJECTED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'DEACTIVATED', 'ENROLLED', 'COMPLETED', 'OPEN', 'NEAR_FULL', 'CONFIRMED', 'LOCKED', 'FAILED', 'CANCELLED', 'RESERVED', 'REFUNDED', 'DRAFT', 'GO', 'NO_GO', 'PUBLISHED'].map((s) => (
        <StatusBadge key={s} status={s} />
      ))}
    </div>
  ),
}
