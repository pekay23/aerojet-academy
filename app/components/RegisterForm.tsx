"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react'; // Import signIn
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create the User in DB
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          // We don't send a password; the API will generate a random one
        })
      });

      const responseData = await res.json();

      if (res.ok) {
        toast.success("Registration successful! Redirecting...");
        
        // 2. AUTO-LOGIN (The Magic Step)
        // We use the credentials returned by the API (or a special token)
        const loginRes = await signIn('credentials', {
          redirect: false,
          email: data.email,
          password: responseData.tempPassword, // API must return this!
        });

        if (loginRes?.ok) {
            router.push('/applicant/dashboard'); // Go straight to dashboard
        } else {
            router.push('/login'); // Fallback
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

      <button type="submit" disabled={loading} className="w-full bg-aerojet-blue hover:bg-aerojet-sky text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-6">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Start Application <ArrowRight className="w-5 h-5" /></>}
      </button>
      
      <p className="text-xs text-center text-gray-500 mt-4">
        By clicking Start, you agree to our Terms. We will email you a temporary password.
      </p>
    </form>
  );
}
