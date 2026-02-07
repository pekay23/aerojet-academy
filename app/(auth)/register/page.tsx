import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import RegisterForm from '@/app/components/RegisterForm'; 

export const metadata: Metadata = {
  title: 'Register',
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      {/* 1. Navbar included explicitly for this page */}
      <Navbar theme="light" />

      {/* 2. Main Content Area */}
      <div className="grow flex items-center justify-center py-24 px-4">
        
        {/* The Card: Exact styling from your reference */}
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          
          {/* Blue Header */}
          <div className="bg-aerojet-blue p-8 text-center text-white">
            <h2 className="text-3xl font-black uppercase tracking-tight">Start Your Journey</h2>
          </div>
          
          {/* Form Container */}
          <div className="p-8 md:p-10">
            <RegisterForm />
            
            {/* Sign In Link - Added to match the flow */}
            <div className="mt-6 text-center text-sm text-gray-500 border-t border-gray-100 pt-4">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-aerojet-blue hover:underline">
                Sign in
                </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Footer included explicitly */}
      <Footer />
    </main>
  );
}
