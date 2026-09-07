import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'

const meta: Meta<typeof DataTable> = {
  title: 'Shared/DataTable',
  component: DataTable,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof DataTable>

const mockData = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', status: 'ACTIVE', role: 'Student' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', status: 'PENDING', role: 'Applicant' },
  { id: '3', name: 'Carol Davis', email: 'carol@example.com', status: 'SUSPENDED', role: 'Student' },
  { id: '4', name: 'Dan Wilson', email: 'dan@example.com', status: 'COMPLETED', role: 'Student' },
]

const columns: { key: string; header: string; cell?: (row: Record<string, unknown>) => React.ReactNode }[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={String(row.status)} /> },
]

export const Default: Story = {
  args: { columns, data: mockData } as unknown as Meta<typeof DataTable>['args'],
}

export const Loading: Story = {
  args: { columns, data: [], loading: true } as unknown as Meta<typeof DataTable>['args'],
}

export const Empty: Story = {
  args: { columns, data: [], emptyMessage: 'No students found' } as unknown as Meta<typeof DataTable>['args'],
}

export const Clickable: Story = {
  args: {
    columns,
    data: mockData,
    onRowClick: (row: Record<string, unknown>) => alert(`Clicked: ${row.name}`),
  } as unknown as Meta<typeof DataTable>['args'],
}
