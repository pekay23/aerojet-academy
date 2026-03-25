import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Pagination } from '@/components/shared/Pagination'

const meta: Meta<typeof Pagination> = {
  title: 'Shared/Pagination',
  component: Pagination,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof Pagination>

export const Default: Story = {
  render: () => {
    const [page, setPage] = useState(1)
    return <Pagination page={page} totalPages={10} onPageChange={setPage} />
  },
}

export const FirstPage: Story = {
  args: { page: 1, totalPages: 5, onPageChange: () => {} },
}

export const LastPage: Story = {
  args: { page: 5, totalPages: 5, onPageChange: () => {} },
}

export const SinglePage: Story = {
  args: { page: 1, totalPages: 1, onPageChange: () => {} },
}
