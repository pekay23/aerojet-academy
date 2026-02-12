export const dynamic = "force-dynamic";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LoginForm from '@/components/portal/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      
      {/* 1. Logo */}
      <div className="mb-8">
        <Link href="/">
          <Image 
            src="/AATA_logo_hor_onWhite.png" 
            alt="Aerojet Academy" 
            width={180} 
            height={45}
            className="object-contain"
          />
        </Link>
      </div>

      {/* 2. The Card Wrapper */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Blue Header */}
        <div className="bg-aerojet-blue p-8 text-center text-white">
          <h1 className="text-2xl font-black uppercase tracking-tight">Welcome Back</h1>
          <p className="text-blue-200 text-sm mt-2">Access your portal</p>
        </div>

        {/* Content Area */}
        <div className="p-8">
           {/* Render the form directly. 
               If LoginForm has its own Border/Shadow, we might need to remove it from THAT component.
               But usually, LoginForm is just inputs + button. 
           */}
           <LoginForm />

           {/* The 'Apply Now' text is here. If it was duplicated 'behind', 
               it means previous code had an overlapping div. This clean structure prevents that. 
           */}
           <div className="mt-6 text-center text-sm text-gray-500 border-t border-gray-100 pt-4">
              Don't have an account?{' '}
              <Link href="/register" className="font-bold text-aerojet-blue hover:underline">
                Apply Now
              </Link>
           </div>
        </div>
      </div>

      {/* 3. Footer Links */}
      <div className="mt-8 text-center text-sm text-gray-400">
        <Link href="/" className="hover:text-aerojet-blue transition-colors">Home</Link>
        {' • '}
        <Link href="/contact" className="hover:text-aerojet-blue transition-colors">Help</Link>
      </div>
    </div>
  );
}
