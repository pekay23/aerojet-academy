import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChangePasswordForm from '@/components/shared/ChangePasswordForm'

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    handleSubmit: (fn: any) => (e: any) => { e.preventDefault(); fn({}) },
    control: {},
    formState: { errors: {} },
  }),
  Form: ({ children }: any) => <form>{children}</form>,
}))

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => ({}),
}))

vi.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => <form>{children}</form>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormField: ({ render }: any) => render({ field: { onChange: vi.fn(), value: '' } }),
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormMessage: () => null,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

describe('ChangePasswordForm', () => {
  it('renders without crashing', () => {
    render(<ChangePasswordForm apiEndpoint="/api/change-password" />)
    expect(screen.getByText('Current Password')).toBeInTheDocument()
  })

  it('renders all password fields', () => {
    render(<ChangePasswordForm apiEndpoint="/api/change-password" />)
    expect(screen.getByText('Current Password')).toBeInTheDocument()
    expect(screen.getByText('New Password')).toBeInTheDocument()
    expect(screen.getByText('Confirm New Password')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<ChangePasswordForm apiEndpoint="/api/change-password" />)
    expect(screen.getByText('Change Password')).toBeInTheDocument()
  })

  it('renders password inputs', () => {
    const { container } = render(<ChangePasswordForm apiEndpoint="/api/change-password" />)
    const inputs = container.querySelectorAll('input[type="password"]')
    expect(inputs.length).toBe(3)
  })
})
