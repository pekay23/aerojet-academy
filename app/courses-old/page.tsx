import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Programmes',
};

const courseList = [
    {
        id: "A",
        title: "Four-Year Full-Time (B1.1 & B2)",
        desc: "Comprehensive theory, advanced hand-skills, and structured work-experience.",
        features: ["Exam fees included", "2 free re-sits", "Logbook & PPE included"],
        link: "/courses/easa-full-time"
    },
    {
        id: "B",
        title: "Two-Year Full-Time (B1.1)",
        desc: "Theory + hand-skills training. The fastest route for school leavers.",
        features: ["Exam fees included", "2 free re-sits", "Optional B2 top-up"],
        link: "/courses/easa-full-time"
    },
    {
        id: "C",
        title: "12-Month Crash Course",
        desc: "Accelerated B1.1 certification for Industry/Military professionals.",
        features: ["Theory & Exams only", "No hand-skills", "Evening/Weekend classes"],
        link: "/courses/easa-full-time"
    },
    {
        id: "D",
        title: "Modular Training",
        desc: "Individual tuition + exam per module. Book your preferred modules and join a scheduled class.",
        features: ["Includes classroom tuition", "One exam sitting included", "Flexible scheduling"],
        link: "/courses/easa-modular"
    },
    {
        id: "E",
        title: "Examination-Only",
        desc: "Self-study candidates booking exam seats directly. Strict deadline policies apply.",
        features: ["Exam seat only", "No tuition provided", "Strict T-21 deadline"],
        link: "/courses/examination-only"
    },
    {
        id: "F",
        title: "Revision Support",
        desc: "Intensive 8-week block tuition designed for groups and organizations (Min 20 students).",
        features: ["Group bookings only", "2 Mock Exams included", "Custom scheduling"],
        link: "/courses/revision-support"
    }
];

export default function CoursesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <div className="grow">
        <PageHero 
          title="Our Training Programmes"
          subtitle="From full-time licensure to flexible modular exams, choose the path that fits your career goals."
          backgroundImage="/coursespage.jpg"
        />

        {/* Main Content */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courseList.map((course) => (
                    <div key={course.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col group hover:border-aerojet-sky">
                        <div className="bg-aerojet-blue p-4 text-white flex justify-between items-center">
                            <span className="font-black text-sm uppercase tracking-widest opacity-70">Option {course.id}</span>
                            <span className="bg-white/10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">Pricing in Portal</span>
                        </div>
                        <div className="p-8 grow flex flex-col">
                            <h3 className="text-xl font-black text-aerojet-blue mb-3 leading-tight group-hover:text-aerojet-sky transition-colors">{course.title}</h3>
                            <p className="text-slate-500 text-sm mb-6 grow leading-relaxed">{course.desc}</p>
                            
                            <ul className="space-y-2 mb-8 border-t border-slate-50 pt-6">
                                {course.features.map(f => (
                                    <li key={f} className="flex items-center text-xs font-bold text-slate-400">
                                        <span className="text-aerojet-sky mr-2 text-lg">✓</span> {f}
                                    </li>
                                ))}
                            </ul>

                            <Link href={course.link} className="block w-full text-center bg-slate-50 hover:bg-aerojet-sky hover:text-white border border-slate-100 text-slate-600 font-black uppercase text-[10px] tracking-widest py-4 rounded-xl transition-all">
                                View Details
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </section>

        {/* Next Steps CTA - Updated with Verbatim Text */}
        <section className="py-20 bg-white border-t border-slate-100">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-4">Ready to Enroll?</h2>
                <p className="text-slate-500 mb-12 max-w-2xl mx-auto">Follow our 4-step process to secure your seat at the academy.</p>
                
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 text-left mb-12">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-aerojet-sky font-black text-xl mb-2 block">01</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-1">Registration Invoice</h4>
                        <p className="text-[11px] text-slate-500 leading-tight">Pay the GHS 350 fee to initiate your application.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-aerojet-sky font-black text-xl mb-2 block">02</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-1">Online Application</h4>
                        <p className="text-[11px] text-slate-500 leading-tight">Submit your docs via the secure portal for review.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-aerojet-sky font-black text-xl mb-2 block">03</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-1">Confirmation Invoice</h4>
                        <p className="text-[11px] text-slate-500 leading-tight">Upon approval, pay your seat deposit or exam fee.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-aerojet-sky font-black text-xl mb-2 block">04</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-1">Start Training</h4>
                        <p className="text-[11px] text-slate-500 leading-tight">Access your materials and receive your start date.</p>
                    </div>
                </div>

                <Link href="/register" className="bg-aerojet-sky text-white px-12 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm hover:bg-aerojet-blue transition-all shadow-lg shadow-blue-100 active:scale-95 inline-block">
                    Start Registration Now
                </Link>
            </div>
        </section>

      </div>
      <Footer />
    </main>
  );
}
