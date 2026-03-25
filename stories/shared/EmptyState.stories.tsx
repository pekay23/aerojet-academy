import type { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { FileText, Users } from 'lucide-react'

const meta: Meta<typeof EmptyState> = {
  title: 'Shared/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: { title: 'No results found', description: 'Try adjusting your search or filters.' },
}

export const WithIcon: Story = {
  args: { icon: FileText, title: 'No documents', description: 'Upload your first document to get started.' },
}

export const WithAction: Story = {
  render: () => (
    <EmptyState
      icon={Users}
      title="No students yet"
      description="Start by inviting students to your course."
      action={<Button>Invite Students</Button>}
    />
  ),
}
