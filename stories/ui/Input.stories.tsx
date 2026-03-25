import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '@/components/ui/input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'number', 'search'] },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
}
export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = { args: { placeholder: 'Enter text...' } }
export const Email: Story = { args: { type: 'email', placeholder: 'email@example.com' } }
export const Password: Story = { args: { type: 'password', placeholder: 'Password' } }
export const Disabled: Story = { args: { disabled: true, placeholder: 'Disabled input', value: 'Cannot edit' } }
export const WithValue: Story = { args: { defaultValue: 'Hello World' } }

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <label htmlFor="email" className="text-sm font-medium">Email</label>
      <Input type="email" id="email" placeholder="email@example.com" />
    </div>
  ),
}
