"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (provider: 'google' | 'credentials') => {
    setIsLoading(true);
    setError(null);
    
    let result;
    if (provider === 'credentials') {
      result = await signIn(provider, { redirect: false, email, password });
    } else {
      result = await signIn(provider, { callbackUrl: '/portal' });
    }

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
    } else if (result?.ok && provider === 'credentials') {
      router.push('/portal/dashboard');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-aerojet-blue z-0"></div>
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-white p-8 text-center border-b border-gray-100">
          <Link href="/"><Image src="/logo-navbar.png" alt="Aerojet Academy" width={180} height={50} className="mx-auto object-contain"/></Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">Student Portal</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
        </div>
        <div className="p-8">
          <div className="space-y-3">
            <button onClick={() => handleLogin('google')} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all">
              <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
              Sign in with Google
            </button>
          </div>
          <div className="my-6 flex items-center"><div className="grow border-t border-gray-200"></div><span className="shrink mx-4 text-xs text-gray-400 uppercase">Or</span><div className="grow border-t border-gray-200"></div></div>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin('credentials'); }} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-sky"/>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-sky"/>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={isLoading} className={`w-full py-3 rounded-lg text-white font-bold transition-all ${isLoading ? "bg-gray-400" : "bg-aerojet-blue hover:bg-aerojet-sky"}`}>
              {isLoading ? "Signing in..." : "Sign In with Email"}
            </button>
          </form>
          <div className="mt-6 text-center text-sm"><Link href="#" className="font-semibold text-aerojet-sky hover:text-aerojet-blue">Forgot Password?</Link></div>
        </div>
      </div>
    </main>
  );
}
