import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PageHero from '../../components/PageHero';
import NextSteps from "@/components/NextSteps"; // Import

export default function ExamOnlyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="Examination-Only"
          subtitle="Certified EASA Part-66 module examinations for self-study candidates and industry professionals."
          backgroundImage="/exam-only.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            
            {/* Overview Section */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Professional Exam Environment</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Aerojet Academy provides a certified, high-standard environment for sitting EASA Part-66 module exams. We offer a rotating schedule of exam windows throughout the year at our Accra facilities.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Seats are limited to 28 per sitting to ensure strict invigilation and a professional atmosphere. All bookings, seat assignments, and results are managed via our secure student portal.
                    </p>
                </div>
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-aerojet-blue text-sm uppercase tracking-widest mb-6">Exam Booking Rules</h3>
                    <ul className="space-y-4 text-sm text-gray-600">
                        <li className="flex items-start gap-3">
                            <span className="text-aerojet-sky font-bold">●</span> 
                            <span><b>T-21 Deadline:</b> Exam windows are confirmed only if minimum numbers are met 21 days prior to the start date.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-aerojet-sky font-bold">●</span> 
                            <span><b>Late Booking:</b> Bookings made within 14 days of an exam incur a late-processing surcharge.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-aerojet-sky font-bold">●</span> 
                            <span><b>No-Shows:</b> Seats are forfeited once schedules are locked.</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Pricing Notice Section */}
            <section className="bg-aerojet-blue rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Transparent Pricing</h2>
                    <p className="text-blue-100 text-lg leading-relaxed mb-6">
                        Detailed pricing for individual module seats, resits, and exam bundles (2-seat and 4-seat options) is available exclusively within the <b>Student Portal</b>.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/register" className="bg-aerojet-sky text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-aerojet-blue transition-all">
                            Register to View Prices
                        </Link>
                        <Link href="/contact" className="border-2 border-white/30 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-aerojet-blue transition-all">
                            Contact Admissions
                        </Link>
                    </div>
                </div>
            </section>

            {/* Pathways Hint */}
            <div className="text-center">
                <p className="text-gray-500 text-sm">
                    Unsure which modules you need? Check our <Link href="/courses/modules" className="text-aerojet-sky font-bold hover:underline">Module Pathways guide</Link>.
                </p>
            </div>

          </div>
        </div>
      </div>
      <NextSteps />
      <Footer />
    </main>
  );
}
