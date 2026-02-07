"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Info } from 'lucide-react';

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '',
    program: 'Full-Time B1.1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          programme: data.program
        })
      });

      const responseData = await res.json();

      if (res.ok) {
        toast.success("Registration successful! check your email.");
        
        // Auto-Login
        const loginRes = await signIn('credentials', {
          redirect: false,
          email: data.email,
          password: responseData.tempPassword,
        });

        if (loginRes?.ok) {
            router.push('/applicant/dashboard');
        } else {
            router.push('/login');
        }
      } else {
        toast.error(responseData.error || "Registration failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input required type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-aerojet-blue outline-none transition-all" 
                value={data.firstName} onChange={e => setData({...data, firstName: e.target.value})} 
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input required type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-aerojet-blue outline-none transition-all" 
                value={data.lastName} onChange={e => setData({...data, lastName: e.target.value})} 
            />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input required type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-aerojet-blue outline-none transition-all" 
            value={data.email} onChange={e => setData({...data, email: e.target.value})} 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input required type="tel" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-aerojet-blue outline-none transition-all" 
            value={data.phone} onChange={e => setData({...data, phone: e.target.value})} 
        />
      </div>

                  {/* PROGRAM SELECTION */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Programme</label>
        <div className="relative">
            <select 
                value={data.program} 
                onChange={e => setData({...data, program: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-aerojet-blue outline-none transition-all appearance-none bg-white text-gray-900"
            >
                <option value="Full-Time">EASA Part-66 Full-Time (B1.1 / B2)</option>
                <option value="Modular">EASA Part-66 Modular</option>
                <option value="Examination-Only">Examination Only</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
      </div>

      {/* FEE NOTICE */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-aerojet-blue shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-aerojet-blue block mb-1">Registration Fee Required</span>
            A non-refundable fee of <strong>GHS 350.00</strong> is required to process your application. You will receive payment details and a link to upload your proof of payment via email immediately after registering.
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-aerojet-blue hover:bg-aerojet-sky text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-6">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Start Application <ArrowRight className="w-5 h-5" /></>}
      </button>
      
      <p className="text-xs text-center text-gray-500 mt-4">
        By clicking Start, you agree to our Terms. Your account login details will be emailed to you.
      </p>
    </form>
  );
}
