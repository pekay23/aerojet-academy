import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PaymentMethodsDisplay from '@/components/shared/PaymentMethodsDisplay'

describe('PaymentMethodsDisplay', () => {
  const methods = [
    {
      id: '1',
      type: 'BANK_TRANSFER',
      label: 'Bank Transfer',
      currency: 'EUR',
      bankName: 'Test Bank',
      bankAccountName: 'Test Account',
      bankAccountNumber: '123456',
      bankSwiftCode: 'TESTSWIFT',
      bankBranch: null,
      momoProvider: null,
      momoNumber: null,
      momoMerchantCode: null,
      momoAccountName: null,
    },
  ]

  it('renders no methods message when empty', () => {
    render(<PaymentMethodsDisplay methods={[]} />)
    expect(screen.getByText('No payment methods available. Please contact the academy.')).toBeInTheDocument()
  })

  it('renders payment details header', () => {
    render(<PaymentMethodsDisplay methods={methods} />)
    expect(screen.getByText('Payment Details')).toBeInTheDocument()
  })

  it('renders bank transfer details', () => {
    render(<PaymentMethodsDisplay methods={methods} />)
    expect(screen.getByText('Test Bank')).toBeInTheDocument()
    expect(screen.getByText('Test Account')).toBeInTheDocument()
    expect(screen.getByText('123456')).toBeInTheDocument()
  })

  it('renders reference when provided', () => {
    render(<PaymentMethodsDisplay methods={methods} reference="REF-123" />)
    expect(screen.getByText('REF-123')).toBeInTheDocument()
  })

  it('switches between multiple methods', () => {
    const multiMethods = [
      ...methods,
      {
        id: '2',
        type: 'MOBILE_MONEY',
        label: 'MoMo',
        currency: 'GHS',
        bankName: null,
        bankAccountName: null,
        bankAccountNumber: null,
        bankSwiftCode: null,
        bankBranch: null,
        momoProvider: 'MTN',
        momoNumber: '0240000000',
        momoMerchantCode: null,
        momoAccountName: null,
      },
    ]
    render(<PaymentMethodsDisplay methods={multiMethods} />)
    expect(screen.getByText('MoMo')).toBeInTheDocument()
    fireEvent.click(screen.getByText('MoMo'))
    expect(screen.getByText('MTN MoMo Pay')).toBeInTheDocument()
  })
})
