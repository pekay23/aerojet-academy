import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import PageHero from '@/components/marketing/PageHero';

export const metadata: Metadata = {
  title: 'Exam Schedule',
};

export default function ExamSchedulePage() {
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

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="grow">
        <PageHero 
          title="Exam Schedule 2026–2027"
          subtitle="Official examination windows for EASA Part-66 modular candidates."
          backgroundImage="/examsschedule.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto space-y-16">
            
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg border-l-8 border-aerojet-sky">
                <h2 className="text-xl font-black uppercase tracking-tight mb-4 text-aerojet-sky">Important Booking Policy</h2>
                <ul className="space-y-2 text-sm text-slate-300">
                    <li>• Exam seats must be <b>paid in full</b> by the Payment Deadline (T-21).</li>
                    <li>• Windows are confirmed only if minimum numbers (60 seats) are met by the deadline.</li>
                    <li>• Unconfirmed windows roll forward to the next date at no extra cost.</li>
                </ul>
            </div>

            {/* 2026 Table */}
            <section>
                <h3 className="text-2xl font-black text-aerojet-blue uppercase tracking-tight mb-6">2026 Schedule</h3>
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

            {/* 2027 Table */}
            <section>
                <h3 className="text-2xl font-black text-aerojet-blue uppercase tracking-tight mb-6">2027 Schedule</h3>
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

            <div className="text-center pt-8">
                <Link href="/login" className="bg-aerojet-sky text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-aerojet-blue transition-all shadow-lg">
                    Book Exam Seats in Portal
                </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

