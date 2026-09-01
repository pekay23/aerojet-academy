import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DatePicker } from '@/components/shared/DatePicker'

const meta: Meta<typeof DatePicker> = {
  title: 'Shared/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof DatePicker>

// Named function renders silence react-hooks rules-of-hooks false-positives
// that fire on arrow `() => { ... }` renders (no component-style name).
export const Default: Story = {
  render: function Default() {
    const [date, setDate] = useState<Date | undefined>()
    return <DatePicker date={date} onSelect={setDate} />
  },
}

export const WithDate: Story = {
  render: function WithDate() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    return <DatePicker date={date} onSelect={setDate} />
  },
}

export const CustomPlaceholder: Story = {
  render: function CustomPlaceholder() {
    const [date, setDate] = useState<Date | undefined>()
    return <DatePicker date={date} onSelect={setDate} placeholder="Select start date" />
  },
}
