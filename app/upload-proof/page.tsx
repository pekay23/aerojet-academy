import { Metadata } from 'next';
import UploadProofClient from './_components/UploadProofClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Suspense } from 'react'; // Import Suspense

export const metadata: Metadata = {
  title: 'Upload Payment Proof',
};

// 1. FORCE DYNAMIC (Fixes the build error)
export const dynamic = 'force-dynamic';

export default function UploadProofPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <Navbar theme="light" />
      <div className="grow flex items-center justify-center py-20 px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-aerojet-blue p-8 text-center text-white">
            <h1 className="text-2xl font-black uppercase tracking-tight">Verify Your Payment</h1>
            <p className="text-blue-100 text-sm mt-2">Upload your receipt to secure your spot.</p>
          </div>
          <div className="p-8">
            {/* 2. Wrap Client Component in Suspense (Best Practice) */}
            <Suspense fallback={<div>Loading...</div>}>
              <UploadProofClient />
            </Suspense>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
