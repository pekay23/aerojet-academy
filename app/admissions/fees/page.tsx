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
          subtitle="Understanding the structured payment milestones for Aerojet Academy training pathways."
          backgroundImage="/techSupport.jpg"
        />
        
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            
            {/* 1. Mandatory Registration Section */}
            <section className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1">
                    <div className="inline-block bg-blue-50 text-aerojet-sky px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">Initial Step</div>
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-4">Mandatory Registration</h2>
                    <p className="text-slate-500 leading-relaxed font-medium">
                        Payment of the registration fee is the first step. It activates your student account and unlocks the full online application form. This fee covers admin verification, background checks, and initial processing.
                    </p>
                </div>
                <div className="shrink-0 w-full md:w-auto bg-slate-900 text-white p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>
                    <span className="block text-[10px] font-bold text-aerojet-sky uppercase tracking-[0.2em] mb-2">Non-Refundable</span>
                    <span className="text-4xl font-black block mb-1">GHS 350.00</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Due Pre-Application</span>
                </div>
            </section>

            {/* 2. Programme Structure Table (FEES COLUMN REMOVED) */}
            <section>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-4">
                    <span className="w-10 h-1 bg-aerojet-sky rounded-full"></span>
                    Payment Milestones by Programme
                </h3>
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
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
                <div className="mt-6 p-4 bg-slate-100 rounded-xl text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Detailed tuition and exam pricing is visible in the <Link href="/portal/login" className="text-aerojet-sky underline">Student Portal</Link> after registration.
                    </p>
                </div>
            </section>

            {/* 3. Policies Grid */}
            <section className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                    <h3 className="text-lg font-black text-aerojet-blue uppercase tracking-tight mb-6">Banking Details</h3>
                    <p className="text-slate-500 text-xs mb-6 leading-relaxed">Payments must be made via bank transfer to our corporate account. Cash is not accepted on campus.</p>
                    <div className="bg-slate-50 p-6 rounded-2xl space-y-3 font-mono text-xs text-slate-700 border border-slate-100">
                        <p><b>BENEFICIARY:</b> Aerojet Aviation</p>
                        <p><b>BANK:</b> [Bank Name]</p>
                        <p><b>ACC NO:</b> [XXXXXXXXXXX]</p>
                        <p><b>SWIFT:</b> [SWIFTCODE]</p>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                    <h3 className="text-lg font-black text-aerojet-blue uppercase tracking-tight mb-6">Refund Rules</h3>
                    <ul className="space-y-5">
                        <li className="flex gap-4 items-start">
                            <span className="shrink-0 w-5 h-5 bg-red-50 text-red-600 rounded flex items-center justify-center text-[10px] font-black mt-0.5">!</span>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">The <b>GHS 350 Registration Fee</b> is strictly non-refundable once the invoice is issued.</p>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="shrink-0 w-5 h-5 bg-red-50 text-red-600 rounded flex items-center justify-center text-[10px] font-black mt-0.5">!</span>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed"><b>Seat Confirmation Deposits (40%)</b> are non-refundable once the cohort is confirmed.</p>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="shrink-0 w-5 h-5 bg-red-50 text-red-600 rounded flex items-center justify-center text-[10px] font-black mt-0.5">!</span>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">Exam bookings can be rolled forward to the next window if cancelled before <b>T-21</b>.</p>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Final CTA */}
            <div className="text-center bg-aerojet-sky rounded-[3rem] py-16 px-8 shadow-2xl">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Start Your Application</h2>
                <p className="text-blue-100 mb-10 max-w-lg mx-auto font-medium">Request your registration fee invoice to unlock the official pricing and enrollment forms.</p>
                <Link href="/register" className="bg-white text-aerojet-blue px-12 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-slate-900 hover:text-white transition-all shadow-lg active:scale-95">
                    Start Registration Now
                </Link>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
