'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          <Link href="/" className="shrink-0 flex items-center gap-2">
             <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold">A</div>
             <span className="font-bold text-xl tracking-tight text-slate-900">Aerojet Academy</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-slate-700 hover:text-blue-900">Home</Link>
            
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-blue-900">
                Courses <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 w-56 pt-2 hidden group-hover:block">
                <div className="bg-white border border-slate-200 rounded-lg shadow-lg py-2 flex flex-col">
                  <Link href="/courses/full-time" className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">EASA Part-66 (Full-Time)</Link>
                  <Link href="/courses/modular" className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">EASA Modular (Flexible)</Link>
                  <div className="border-t my-1"></div>
                  <Link href="/courses/cabin-crew" className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50">Cabin Crew (Coming Soon)</Link>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-blue-900">
                Admissions <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 w-56 pt-2 hidden group-hover:block">
                <div className="bg-white border border-slate-200 rounded-lg shadow-lg py-2 flex flex-col">
                  <Link href="/admissions/how-to-apply" className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">How to Apply</Link>
                  <Link href="/admissions/fees" className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Fees & Payments</Link>
                  <Link href="/admissions/requirements" className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Entry Requirements</Link>
                </div>
              </div>
            </div>

            <Link href="/news" className="text-sm font-medium text-slate-700 hover:text-blue-900">Newsroom</Link>
            <Link href="/contact" className="text-sm font-medium text-slate-700 hover:text-blue-900">Contact</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-slate-700">Portal Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-900 hover:bg-blue-800 text-white shadow-sm">Start Registration</Button>
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-700">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 p-4 space-y-4">
          <Link href="/" className="block text-base font-medium text-slate-900">Home</Link>
          <div className="pt-4 flex flex-col gap-3">
            <Link href="/auth/signin" className="w-full">
               <Button variant="outline" className="w-full justify-center">Portal Login</Button>
            </Link>
            <Link href="/register" className="w-full">
               <Button className="w-full justify-center bg-blue-900">Start Registration</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
