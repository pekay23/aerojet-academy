import React from 'react';
import WalletClient from './_components/WalletClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wallet | Student Portal',
};

export default function WalletPage() {
  return <WalletClient />;
}
