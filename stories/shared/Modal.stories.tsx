import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import Modal from '@/components/shared/Modal'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof Modal> = {
  title: 'Shared/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl', '2xl', 'full'] },
    showClose: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Modal>

// Named function renders silence react-hooks rules-of-hooks false-positives
// that fire on arrow `() => { ... }` renders (no component-style name).
export const Default: Story = {
  render: function Default() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal isOpen={open} onClose={() => setOpen(false)} title="Example Modal">
          <p className="text-sm text-muted-foreground">This is the modal content.</p>
        </Modal>
      </>
    )
  },
}

export const Large: Story = {
  render: function Large() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Large Modal</Button>
        <Modal isOpen={open} onClose={() => setOpen(false)} title="Large Modal" size="lg">
          <p className="text-sm text-muted-foreground">A larger modal for more content.</p>
        </Modal>
      </>
    )
  },
}
