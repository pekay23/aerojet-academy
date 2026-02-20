import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Application Terms | Aerojet Academy" };

export default function TermsPage() {
  return (
    <div className="bg-slate-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white p-6 sm:p-14 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
          <div className="mb-10 border-b border-slate-100 pb-6">
            <span className="bg-blue-50 text-[#4c9ded] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Legal Policy</span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#002a5c] dark:text-white uppercase tracking-tight leading-tight">Online Application Terms & Conditions</h1>
            <p className="text-slate-400 mt-3 text-sm italic">Last Updated: February 2026</p>
          </div>

          <div className="space-y-8 text-slate-700">
            <p className="text-lg font-medium text-slate-900 leading-relaxed">
              By initiating the registration process or submitting an application to Aerojet Aviation Training Academy, you acknowledge that you have read, understood, and agree to the following terms.
            </p>

            {[
              { title: "1. Registration Gating & Fees", items: ["A one-time Registration Fee of GHS 350.00 is mandatory for all programmes.", "The Registration Fee is strictly non-refundable.", "Payment is required before the Online Application Form link is released."] },
              { title: "2. Enrollment & Seat Confirmation", items: ["Approved applicants must pay a 40% Seat Confirmation Deposit.", "Modular/Exam enrollment requires 100% upfront payment.", "Failure to settle invoices by deadline may result in seat forfeiture."] },
              { title: "3. Examination Policies", items: ["Exam windows are confirmed 21 days prior (Go/No-Go at T-21).", "If cancelled, all bookings roll to next available window at no extra cost.", "Late bookings (within T-14) incur a €50 surcharge.", "No-shows forfeit their fees."] },
              { title: "4. The 24-Month Rule (Modular)", items: ["All required exams must be completed within a 24-month window from the date of the first passed module."] },
              { title: "5. Cohort Minimums", items: ["Start dates are indicative and subject to minimum cohort sizes.", "Aerojet reserves the right to adjust schedules or defer intakes."] },
              { title: "6. Documentation & Conduct", items: ["All uploaded documents must be authentic.", "Forged documents result in immediate disqualification, fee forfeiture, and permanent ban."] },
            ].map((section) => (
              <section key={section.title}>
                <h3 className="text-lg font-black text-[#002a5c] uppercase tracking-tight mb-3">{section.title}</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600 leading-relaxed">
                  {section.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>
            ))}

            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-5">
              <div>
                <p className="font-black text-[#002a5c] uppercase text-sm">Have Questions?</p>
                <p className="text-xs text-slate-500">Send us an enquiry.</p>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/contact" className="text-[#4c9ded] font-bold text-xs uppercase tracking-widest hover:underline">Contact Us</Link>
                <Link href="/register" className="bg-[#4c9ded] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#002a5c] transition-all">Start Registration</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}