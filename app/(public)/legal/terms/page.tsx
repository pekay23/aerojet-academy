import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/app/components/marketing/Navbar';
import Footer from '@/app/components/marketing/Footer';

export const metadata: Metadata = {
  title: 'Application Terms',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50 pt-20">
      <div className="grow container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-16 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">

          {/* Header */}
          <div className="mb-12 border-b border-slate-100 pb-8">
            <span className="bg-blue-50 text-aerojet-sky px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
              Legal Policy
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-aerojet-blue uppercase tracking-tight leading-tight">
              Online Application <br />Terms & Conditions
            </h1>
            <p className="text-slate-600 mt-4 font-medium text-sm italic">
              Last Updated: February 2026
            </p>
          </div>

          <div className="space-y-8 text-slate-800">

            <p className="text-lg font-medium text-slate-900 leading-relaxed">
              By initiating the registration process or submitting an application to Aerojet Aviation Training Academy, you acknowledge that you have read, understood, and agree to the following terms.
            </p>

            <section>
              <h3 className="text-xl font-black text-aerojet-blue uppercase tracking-tight mb-4">1. Registration Gating & Fees</h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-700 leading-relaxed">
                <li><strong className="text-slate-900">Initial Payment:</strong> A one-time Registration Fee of <strong className="text-slate-900">GHS 350.00</strong> is mandatory for all programmes.</li>
                <li><strong className="text-slate-900">Non-Refundable:</strong> The Registration Fee is strictly non-refundable and covers administrative processing, background checks, and verification.</li>
                <li><strong className="text-slate-900">Access:</strong> Payment of this fee is required before the secure Online Application Form link is released to the candidate.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-black text-aerojet-blue uppercase tracking-tight mb-4">2. Enrollment & Seat Confirmation</h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-700 leading-relaxed">
                <li><strong className="text-slate-900">Full-Time Programmes:</strong> Approved applicants must pay a <strong className="text-slate-900">40% Seat Confirmation Deposit</strong> of the first year's tuition to secure their place in the cohort.</li>
                <li><strong className="text-slate-900">Modular/Exam Programmes:</strong> Enrollment is confirmed only upon 100% upfront payment of the booked module or exam seat.</li>
                <li><strong className="text-slate-900">Deadlines:</strong> Failure to settle confirmation invoices by the specified deadline may result in the seat being offered to the next candidate on the waitlist.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-black text-aerojet-blue uppercase tracking-tight mb-4">3. Examination Policies (Exam-Only)</h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-700 leading-relaxed">
                <li><strong className="text-slate-900">Go/No-Go Decision (T-21):</strong> Exam windows are confirmed 21 days prior to the start date. Sittings proceed only if the minimum threshold (60 paid seats or 3 Group Charters) is met.</li>
                <li><strong className="text-slate-900">Roll-over Rule:</strong> If a window is cancelled due to low numbers, all confirmed bookings will roll to the next available window at no extra cost.</li>
                <li><strong className="text-slate-900">Late Booking:</strong> Bookings made within 14 days (T-14) of an exam incur a <strong className="text-slate-900">€50 surcharge</strong>, subject to seat availability.</li>
                <li><strong className="text-slate-900">No-Shows:</strong> Candidates who fail to attend a scheduled and locked exam sitting forfeit their fees.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-black text-aerojet-blue uppercase tracking-tight mb-4">4. The 24-Month Rule (Modular)</h3>
              <p className="text-slate-700 leading-relaxed">
                In accordance with EASA standards, candidates pursuing a full category certification via the modular route must successfully complete all required examinations within a <strong className="text-slate-900">24-month window</strong>, starting from the date of the first passed module.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-black text-aerojet-blue uppercase tracking-tight mb-4">5. Cohort Minimums & Start Dates</h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-700 leading-relaxed">
                <li>Course start dates are indicative. Actual commencement is subject to meeting minimum cohort sizes.</li>
                <li>Aerojet Academy reserves the right to adjust schedules or defer intakes if minimum numbers are not reached. Enrolled students will be notified via the Student Portal.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-black text-aerojet-blue uppercase tracking-tight mb-4">6. Documentation & Conduct</h3>
              <p className="text-slate-700 leading-relaxed">
                All documents uploaded to the portal (Passport, Certificates, Transcripts) must be authentic. Submission of forged documents will result in immediate disqualification, forfeiture of fees, and a permanent ban from the Academy.
              </p>
            </section>

            <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p className="font-black text-aerojet-blue uppercase text-sm">Have Questions?</p>
                <p className="text-xs text-slate-700">Send us an enquiry.</p>
              </div>
              <div className="flex items-center gap-6">
                <Link href="/contact" className="text-[#4c9ded] font-bold text-xs uppercase tracking-widest hover:underline">
                  Contact Us
                </Link>
                <Link href="/register" className="bg-aerojet-sky text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-aerojet-blue transition-all shadow-md">
                  Start Registration
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
