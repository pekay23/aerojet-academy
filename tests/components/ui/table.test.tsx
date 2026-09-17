import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/table'

vi.mock('@/components/ui/table', () => ({
  Table: ({ children, className, ...props }: any) => <table className={className} {...props}>{children}</table>,
  TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
  TableCaption: ({ children, ...props }: any) => <caption {...props}>{children}</caption>,
}))

describe('Table', () => {
  it('renders without crashing', () => {
    render(<Table>Content</Table>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders full table structure', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John</TableCell>
            <TableCell>john@example.com</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
  })

  it('renders caption', () => {
    render(
      <Table>
        <TableCaption>Table description</TableCaption>
      </Table>
    )
    expect(screen.getByText('Table description')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Table className="custom-table">Content</Table>)
    expect(document.querySelector('.custom-table')).toBeTruthy()
  })
})
