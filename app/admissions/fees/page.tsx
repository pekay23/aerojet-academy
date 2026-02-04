import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Fees & Rules',
};

export default function FeesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <div className="grow">
        <PageHero 
          title="Fees & Payment Rules"
          subtitle="Understanding the structured payment milestones for Aerojet Academy training programmes."
          backgroundImage="/techSupport.jpg"
        />
        
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            
            {/* 1. Mandatory Registration Section */}
            <section className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1">
                    <div className="inline-block bg-blue-50 text-aerojet-sky px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">Step 01</div>
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-4">Mandatory Registration</h2>
                    <p className="text-slate-500 leading-relaxed font-medium">
                        To initiate your journey, a one-time registration fee is required. This activates your record and unlocks the official application link. This fee covers administrative processing and background verification.
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto bg-slate-900 text-white p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>
                    <span className="block text-[10px] font-bold text-aerojet-sky uppercase tracking-[0.2em] mb-2">Pre-Application</span>
                    <span className="text-4xl font-black block mb-1">GHS 350.00</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Strictly Non-Refundable</span>
                </div>
            </section>

            {/* 2. Programme Structure Table */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-1 bg-aerojet-sky rounded-full" />
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Payment Milestones</h3>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-4xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm min-w-175">
                            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="p-6">Option</th>
                                    <th className="p-6">Programme</th>
                                    <th className="p-6">Initial Confirmation</th>
                                    <th className="p-6">Balance Schedule</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[
                                    { id: "A", name: "Four-Year Full-Time (B1.1 & B2)", deposit: "40% of Year 1", balance: "2 installments per year" },
                                    { id: "B", name: "Two-Year Full-Time (B1.1)", deposit: "40% of Year 1", balance: "2 installments per year" },
                                    { id: "C", name: "12-Month Crash Course", deposit: "40% Total Fee", balance: "2 installments total" },
                                    { id: "D", name: "Modular Training", deposit: "100% per Module", balance: "Pay-as-you-go" },
                                    { id: "E", name: "Examination-Only Seat", deposit: "50% per Exam", balance: "Settled by T-14 days" },
                                    { id: "F", name: "Revision Support", deposit: "100% per Block", balance: "Paid upfront" },
                                ] .map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6 font-black text-aerojet-sky">{row.id}</td>
                                        <td className="p-6 font-bold text-slate-800">{row.name}</td>
                                        <td className="p-6 font-black text-aerojet-blue">{row.deposit}</td>
                                        <td className="p-6 text-slate-500 font-medium text-xs">{row.balance}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mt-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Detailed tuition and exam pricing is visible in the <Link href="/portal/login" className="text-aerojet-sky underline hover:text-aerojet-blue">Student Portal</Link> after registration fee is verified.
                    </p>
                </div>
            </section>

            {/* 3. Refund Rules Card */}
            <section className="max-w-3xl mx-auto">
                <div className="bg-white p-10 md:p-12 rounded-[3rem] shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M13 13h-2V7h2v6zm0 4h-2v-2h2v2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>
                    </div>
                    
                    <h3 className="text-xl font-black text-aerojet-blue uppercase tracking-tight mb-8 flex items-center gap-3">
                        <span className="w-2 h-8 bg-red-500 rounded-full" />
                        Refund & Cancellation Rules
                    </h3>
                    
                    <ul className="space-y-6">
                        <li className="flex gap-5 items-start group">
                            <div className="shrink-0 w-6 h-6 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-[10px] font-black group-hover:bg-red-600 group-hover:text-white transition-colors mt-1">!</div>
                            <div>
                                <p className="text-sm text-slate-700 font-bold leading-tight mb-1 uppercase tracking-tight">Registration Fees</p>
                                <p className="text-xs text-slate-500 leading-relaxed">The GHS 350.00 fee is strictly non-refundable once the invoice is generated and processing begins.</p>
                            </div>
                        </li>
                        <li className="flex gap-5 items-start group">
                            <div className="shrink-0 w-6 h-6 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-[10px] font-black group-hover:bg-red-600 group-hover:text-white transition-colors mt-1">!</div>
                            <div>
                                <p className="text-sm text-slate-700 font-bold leading-tight mb-1 uppercase tracking-tight">Seat Confirmation Deposits</p>
                                <p className="text-xs text-slate-500 leading-relaxed">The 40% deposit confirms your place in a specific cohort. This is non-refundable once the cohort has been officially confirmed.</p>
                            </div>
                        </li>
                        <li className="flex gap-5 items-start group">
                            <div className="shrink-0 w-6 h-6 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-[10px] font-black group-hover:bg-red-600 group-hover:text-white transition-colors mt-1">!</div>
                            <div>
                                <p className="text-sm text-slate-700 font-bold leading-tight mb-1 uppercase tracking-tight">Examination Sittings</p>
                                <p className="text-xs text-slate-500 leading-relaxed">Confirmed bookings may roll forward to the next window if requested before <b>T-21</b>. No-shows result in total forfeiture of fees.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </section>

            {/* 4. Final CTA */}
            <div className="text-center bg-aerojet-sky rounded-[3rem] py-16 px-8 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Begin the Process</h2>
                    <p className="text-blue-100 mb-10 max-w-lg mx-auto font-medium">Request your registration invoice to unlock official pricing and gain portal access.</p>
                    <Link href="/register" className="bg-white text-aerojet-blue px-12 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all shadow-lg active:scale-95 inline-block">
                        Start Registration Now
                    </Link>
                </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
