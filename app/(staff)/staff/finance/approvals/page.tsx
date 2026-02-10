import React from 'react';
import { Metadata } from 'next';
import PendingFeesTable from '@/components/staff/PendingFeesTable';
import { LayoutDashboard, WalletCards } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Approvals | Finance Portal',
    description: 'Review and approve pending payments.',
};

export default function ApprovalsPage() {
    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <WalletCards className="w-7 h-7 text-aerojet-blue" /> Finance Approvals
                    </h1>
                    <p className="text-slate-500 mt-1">Review pending proof of payments from applicants.</p>
                </div>
            </div>

            <PendingFeesTable />
        </div>
    );
}
