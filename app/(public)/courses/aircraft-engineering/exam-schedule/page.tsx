import { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import PageHero from '@/app/(public)/_components/Hero';
import SectionReveal from '@/app/(public)/_components/SectionReveal';

export const metadata: Metadata = {
  title: 'Exam Schedule 2026-2027',
  description: 'Official examination windows for EASA Part-66 modular candidates at Aerojet Academy.',
};

const schedule2026 = [
  { window: "Jun 2026", dates: "23–24 Jun 2026", deadline: "15 Mar 2026" },
  { window: "Sep 2026", dates: "14–15 Sep 2026", deadline: "06 Jun 2026" },
  { window: "Dec 2026", dates: "21–22 Dec 2026", deadline: "12 Sep 2026" },
];

const schedule2027 = [
  { window: "Mar 2027", dates: "18–20 Mar 2027", deadline: "08 Dec 2026" },
  { window: "Jun 2027", dates: "28–30 Jun 2027", deadline: "20 Mar 2027" },
  { window: "Sep/Oct 2027", dates: "29 Sep–01 Oct 2027", deadline: "21 Jun 2027" },
  { window: "Dec 2027", dates: "15–17 Dec 2027", deadline: "06 Sep 2027" },
];

export default function ExamSchedulePage() {
  return (
    <div className="bg-white">
      <PageHero 
        title="Exam Schedule 2026–2027"
        subtitle="Official examination windows for EASA Part-66 modular candidates."
        backgroundImage="/images/hero/examsschedule.jpg" // Make sure this image path is correct
      />
      <div className="container mx-auto px-6 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto space-y-16">
          
          <SectionReveal>
            <div className="bg-public-primary text-white p-8 rounded-3xl shadow-lg border-l-8 border-public-secondary">
                <div className="flex items-center gap-4 mb-4">
                    <AlertTriangle className="w-8 h-8 text-public-secondary"/>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white">Important Booking Policy</h2>
                </div>
                <ul className="space-y-2 text-sm text-slate-300 list-disc pl-5">
                    <li>Exam seats must be <strong>paid in full</strong> by the Payment Deadline (T-21).</li>
                    <li>Windows are confirmed only if minimum numbers (60 seats) are met by the deadline.</li>
                    <li>Unconfirmed windows roll forward to the next date at no extra cost.</li>
                </ul>
            </div>
          </SectionReveal>

          {/* 2026 Table */}
          <SectionReveal>
            <section>
                <h3 className="text-2xl font-black text-public-primary uppercase tracking-tight mb-6">2026 Schedule</h3>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                            <tr>
                                <th className="p-4">Window</th>
                                <th className="p-4">Exam Dates</th>
                                <th className="p-4 text-red-600">Payment Deadline</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {schedule2026.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-800">{row.window}</td>
                                    <td className="p-4">{row.dates}</td>
                                    <td className="p-4 font-bold text-red-600">{row.deadline}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
          </SectionReveal>

          {/* 2027 Table */}
          <SectionReveal>
            <section>
                <h3 className="text-2xl font-black text-public-primary uppercase tracking-tight mb-6">2027 Schedule</h3>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                            <tr>
                                <th className="p-4">Window</th>
                                <th className="p-4">Exam Dates</th>
                                <th className="p-4 text-red-600">Payment Deadline</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {schedule2027.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-800">{row.window}</td>
                                    <td className="p-4">{row.dates}</td>
                                    <td className="p-4 font-bold text-red-600">{row.deadline}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
          </SectionReveal>

          <div className="text-center pt-8">
              <Link href="/login" className="inline-block bg-public-secondary text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-public-primary transition-all shadow-lg">
                  Book Exam Seats in Portal
              </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
