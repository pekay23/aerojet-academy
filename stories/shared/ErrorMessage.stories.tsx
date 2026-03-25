import type { Meta, StoryObj } from '@storybook/react'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

const meta: Meta<typeof ErrorMessage> = {
  title: 'Shared/ErrorMessage',
  component: ErrorMessage,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof ErrorMessage>

export const Default: Story = {
  args: { message: 'Something went wrong. Please try again later.' },
}

export const WithCustomTitle: Story = {
  args: { title: 'Network Error', message: 'Failed to fetch data from the server.' },
}

export const WithRetry: Story = {
  args: {
    title: 'Load Failed',
    message: 'Could not load student records.',
    retry: () => alert('Retrying...'),
  },
}
