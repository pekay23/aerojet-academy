import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { useForm } from 'react-hook-form'

vi.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => <div>{children}</div>,
  useFormContext: () => ({ getFieldState: () => ({}), formState: { errors: {} } }),
  Controller: ({ render }: any) => render({ field: { onChange: vi.fn(), value: '' } }),
  useFormField: () => ({
    id: 'test-id',
    name: 'test',
    formItemId: 'test-form-item',
    formDescriptionId: 'test-form-item-description',
    formMessageId: 'test-form-item-message',
  }),
}))

vi.mock('@radix-ui/react-label', () => ({
  Root: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

vi.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

describe('Form', () => {
  it('renders form items', () => {
    render(
      <Form {...useForm()}>
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <input />
          </FormControl>
          <FormDescription>Enter your email</FormDescription>
          <FormMessage />
        </FormItem>
      </Form>
    )
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Enter your email')).toBeInTheDocument()
  })
})
