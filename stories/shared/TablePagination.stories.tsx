import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import TablePagination from '@/components/shared/TablePagination'

const meta: Meta<typeof TablePagination> = {
  title: 'Shared/TablePagination',
  component: TablePagination,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof TablePagination>

export const Default: Story = {
  render: function Default() {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(25)
    return (
      <TablePagination
        page={page}
        perPage={perPage}
        total={243}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />
    )
  },
}

export const FewResults: Story = {
  args: { page: 1, perPage: 25, total: 8, onPageChange: () => {}, onPerPageChange: () => {} },
}

export const Empty: Story = {
  args: { page: 1, perPage: 25, total: 0, onPageChange: () => {}, onPerPageChange: () => {} },
}
