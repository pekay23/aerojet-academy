"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill email from query params if present
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleLogin = async (provider: 'google' | 'credentials') => {
    setIsLoading(true);
    setError(null);

    let result;
    if (provider === 'credentials') {
      result = await signIn(provider, { redirect: false, email, password });
    } else {
      result = await signIn(provider, { callbackUrl: '/student/dashboard' }); // Updated redirect
    }

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
    } else if (result?.ok && provider === 'credentials') {
      // 🚀 Redirect to Student Portal (Middleware will bounce staff to Staff Portal if needed)
      router.push('/student/dashboard');
    }
  };

  return (
    // ❌ REMOVED: <main>, blue background, card wrapper, header
    // ✅ KEPT: Just the form content
    <div className="space-y-4">

      {/* Google Button */}
      <div className="space-y-3">
        <button onClick={() => handleLogin('google')} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all">
          <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
          Sign in with Google
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center py-2">
        <div className="grow border-t border-gray-200"></div>
        <span className="shrink mx-4 text-xs text-gray-400 uppercase">Or</span>
        <div className="grow border-t border-gray-200"></div>
      </div>

      {/* Credentials Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleLogin('credentials'); }} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-blue text-gray-900" // Added text color
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-blue text-gray-900" // Added text color
          />
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <button type="submit" disabled={isLoading} className={`w-full py-3 rounded-lg text-white font-bold transition-all ${isLoading ? "bg-gray-400" : "bg-aerojet-blue hover:bg-aerojet-sky"}`}>
          {isLoading ? "Signing in..." : "Sign In with Email"}
        </button>
      </form>

      <div className="text-center text-sm">
        <Link href="#" className="font-semibold text-aerojet-sky hover:text-aerojet-blue">Forgot Password?</Link>
      </div>
    </div>
  );
}
