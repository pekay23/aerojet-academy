import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicFooter from '@/components/layouts/PublicFooter'

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img src={props.src} alt={props.alt} width={props.width} height={props.height} />,
}))

describe('PublicFooter', () => {
  it('renders without crashing', () => {
    render(<PublicFooter />)
    expect(screen.getByText('Programmes')).toBeInTheDocument()
  })

  it('renders all section headings', () => {
    render(<PublicFooter />)
    expect(screen.getByText('Programmes')).toBeInTheDocument()
    expect(screen.getByText('Admissions')).toBeInTheDocument()
    expect(screen.getByText('Company')).toBeInTheDocument()
    expect(screen.getByText('Contact Us')).toBeInTheDocument()
  })

  it('renders contact info', () => {
    render(<PublicFooter />)
    expect(screen.getByText(/ATTC, Kokomlemle/)).toBeInTheDocument()
    expect(screen.getByText(/\+233-20-984-8423/)).toBeInTheDocument()
  })

  it('renders copyright', () => {
    render(<PublicFooter />)
    expect(screen.getByText(/Aerojet Aviation Training Academy. All Rights Reserved/)).toBeInTheDocument()
  })

  it('renders social links', () => {
    render(<PublicFooter />)
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
    expect(screen.getByLabelText('Twitter/X')).toBeInTheDocument()
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
  })
})
