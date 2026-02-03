import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RegisterForm from '@/components/RegisterForm';

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50 pt-20">
      <Navbar theme="light" />
      <div className="grow flex items-center justify-center py-16 px-4">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-aerojet-blue p-8 text-center text-white">
            <h2 className="text-3xl font-black uppercase tracking-tight">Start Your Journey</h2>
          </div>
          <div className="p-8 md:p-10">
            <RegisterForm />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
