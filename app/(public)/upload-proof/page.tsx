import { Metadata } from 'next';
import UploadProofClient from './_components/UploadProofClient';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
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
          <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
            <UploadProofClient />
          </Suspense>
        </div>
      </div>
      <Footer />
    </main>
  );
}

