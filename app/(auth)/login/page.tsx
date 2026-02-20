import { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = { title: "Sign In | Aerojet Academy" };

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-[#002a5c] uppercase tracking-tight">Welcome Back</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Sign in to your portal account.</p>
      </div>

      <LoginForm />

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{" "}
          <Link href="/register" className="font-bold text-[#4c9ded] hover:underline">
            Register here
          </Link>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest">
          Secure login powered by Aerojet Academy Portal
        </p>
      </div>
    </div>
  );
}
