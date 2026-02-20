export const mockWallet = {
  id: 'wallet-1',
  userId: 'student-1',
  balance: 1500,
  reservedBalance: 0,
  currency: 'EUR',
}

export const mockTopUpTransaction = {
  id: 'tx-1',
  walletId: 'wallet-1',
  type: 'TOP_UP',
  amount: 500,
  description: 'Wallet top-up',
  reference: 'WTU-ABC123',
  balanceBefore: 1000,
  balanceAfter: 1500,
  createdAt: new Date(),
}

export const mockReserveTransaction = {
  id: 'tx-2',
  walletId: 'wallet-1',
  type: 'RESERVE',
  amount: 300,
  description: 'Reserved for pool: March 2026',
  reference: 'POOL-pool1',
  balanceBefore: 1500,
  balanceAfter: 1500,
  createdAt: new Date(),
}

export const mockPayment = {
  id: 'payment-1',
  userId: 'student-1',
  type: 'WALLET_TOP_UP',
  amount: 500,
  currency: 'EUR',
  status: 'PENDING',
  reference: 'WTU-ABC123',
  method: 'BANK_TRANSFER',
}
