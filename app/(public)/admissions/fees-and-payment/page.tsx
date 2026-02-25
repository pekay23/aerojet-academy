import { Metadata } from "next";
import Link from "next/link";
import Hero from "../../_components/Hero";
import SectionReveal from "../../_components/SectionReveal";

export const metadata: Metadata = { title: "Fees & Payment | Aerojet Academy" };

const milestones = [
  { id: "A", name: "Four-Year Full-Time (B1.1 & B2)", deposit: "40% of Year 1", balance: "2 instalments per year" },
  { id: "B", name: "Two-Year Full-Time (B1.1)", deposit: "40% of Year 1", balance: "2 instalments per year" },
  { id: "C", name: "12-Month Crash Course", deposit: "40% Total Fee", balance: "2 instalments total" },
  { id: "D", name: "Modular Training", deposit: "100% per Module", balance: "Pay-as-you-go" },
  { id: "E", name: "Examination-Only Seat", deposit: "50% per Exam", balance: "Settled by T-14 days" },
  { id: "F", name: "Revision Support", deposit: "100% per Block", balance: "Paid upfront" },
];

export default function FeesPage() {
  return (
    <div className="bg-slate-50">
      <Hero title="Fees & Payment Rules" subtitle="Structured payment milestones for Aerojet Academy training programmes." backgroundImage="/images/hero/feespayment.webp" />      <div className="max-w-5xl mx-auto px-6 py-20 space-y-16">
        {/* Registration Fee */}
        <SectionReveal>
          <section className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-block bg-blue-50 text-[#4c9ded] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">Step 01</div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#002a5c] uppercase tracking-tight mb-4">Mandatory Registration</h2>
              <p className="text-slate-500 leading-relaxed">
                To initiate your journey, a one-time registration fee is required. This activates your record and unlocks the official application link. This fee covers administrative processing and background verification.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto bg-slate-900 text-white p-6 sm:p-8 rounded-2xl text-center shadow-2xl">
              <span className="block text-[10px] font-bold text-[#4c9ded] uppercase tracking-[0.2em] mb-2">Pre-Application</span>
              <span className="text-4xl font-black block mb-1">GHS 350</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase">Non-Refundable</span>
            </div>
          </section>
        </SectionReveal>

        {/* Payment Milestones */}
        <SectionReveal>
          <section>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">Payment Milestones</h3>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-5">Option</th>
                      <th className="p-5">Programme</th>
                      <th className="p-5">Initial Confirmation</th>
                      <th className="p-5">Balance Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {milestones.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-5 font-black text-[#4c9ded]">{row.id}</td>
                        <td className="p-5 font-bold text-slate-800">{row.name}</td>
                        <td className="p-5 font-bold text-[#002a5c]">{row.deposit}</td>
                        <td className="p-5 text-slate-500 text-xs font-medium">{row.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-5 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Detailed tuition and exam pricing is visible in the Student Portal after registration.
              </p>
            </div>
          </section>
        </SectionReveal>

        {/* Refund Rules */}
        <SectionReveal>
          <section className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-[#002a5c] uppercase tracking-tight mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-red-500 rounded-full" /> Refund & Cancellation Rules
            </h3>
            <ul className="space-y-5">
              {[
                { title: "Registration Fees", desc: "The GHS 350 fee is strictly non-refundable once the invoice is generated." },
                { title: "Seat Confirmation Deposits", desc: "The 40% deposit confirms your place. Non-refundable once the cohort has been officially confirmed." },
                { title: "Examination Sittings", desc: "Confirmed bookings may roll forward to the next window if requested before T-21. No-shows result in total forfeiture." },
              ].map((rule) => (
                <li key={rule.title} className="flex gap-4 items-start">
                  <div className="shrink-0 w-6 h-6 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5">!</div>
                  <div>
                    <p className="text-sm text-slate-700 font-bold mb-1 uppercase tracking-tight">{rule.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{rule.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </SectionReveal>

        {/* CTA */}
        <SectionReveal>
          <div className="text-center bg-[#4c9ded] rounded-2xl sm:rounded-3xl py-14 px-8 shadow-xl">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Begin the Process</h2>
            <p className="text-blue-100 mb-8 max-w-lg mx-auto">Request your registration invoice to unlock official pricing and gain portal access.</p>
            <Link href="/register" className="inline-block bg-white text-[#002a5c] px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all active:scale-[0.98]">
              Start Registration
            </Link>
          </div>
        </SectionReveal>
      </div>
    </div>
  );
}