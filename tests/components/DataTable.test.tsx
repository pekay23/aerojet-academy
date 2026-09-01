import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable } from '@/components/shared/DataTable'

interface Row {
  id: string
  name: string
  email: string
}

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
  ]

  const data: Row[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ]

  it('renders rows with correct data', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('renders headers', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('shows empty state when data is empty', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No records" />)
    expect(screen.getByText('No records')).toBeInTheDocument()
  })

  it('shows default empty message', () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText('No data found')).toBeInTheDocument()
  })

  it('renders skeletons when loading', () => {
    const { container } = render(<DataTable columns={columns} data={[]} loading />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(5)
  })

  it('calls onRowClick when row is clicked', () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />)
    fireEvent.click(screen.getByText('Alice'))
    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })

  it('applies cursor-pointer when onRowClick is provided', () => {
    const { container } = render(<DataTable columns={columns} data={data} onRowClick={() => {}} />)
    const bodyRows = container.querySelectorAll('tbody tr')
    expect(bodyRows[0].getAttribute('class')).toContain('cursor-pointer')
  })
})
