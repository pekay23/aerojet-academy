import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHero from '../components/PageHero';

const courseList = [
    {
        id: "A",
        title: "Four-Year Full-Time (B1.1 & B2)",
        price: "€13,500 / year",
        desc: "Comprehensive theory, advanced hand-skills, and structured work-experience.",
        features: ["Exam fees included", "2 free re-sits", "Logbook & PPE included"],
        link: "/courses/easa-full-time"
    },
    {
        id: "B",
        title: "Two-Year Full-Time (B1.1)",
        price: "€11,250 / year",
        desc: "Theory + hand-skills training. The fastest route for school leavers.",
        features: ["Exam fees included", "2 free re-sits", "Optional B2 top-up"],
        link: "/courses/easa-full-time"
    },
    {
        id: "C",
        title: "12-Month Crash Course",
        price: "€9,540 total",
        desc: "Accelerated B1.1 certification for Industry/Military professionals.",
        features: ["Theory & Exams only", "No hand-skills", "Evening/Weekend classes"],
        link: "/courses/easa-full-time"
    },
    {
        id: "D",
        title: "Modular Training",
        price: "Pay per Module",
        desc: "Book tuition and exams module-by-module. Learn at your own pace.",
        features: ["Flexible schedule", "Pay as you go", "Portal booking"],
        link: "/courses/easa-modular"
    },
    {
        id: "E",
        title: "Examination-Only",
        price: "From €520 / seat",
        desc: "Self-study candidates can book exam seats directly.",
        features: ["Bundles available", "Group Charter options", "Strict T-21 deadline"],
        link: "/courses/easa-modular" // or a new exam-only page
    },
    {
        id: "F",
        title: "Revision Support",
        price: "€120 / module series",
        desc: "8-week targeted tuition and mock exams for exam-only candidates.",
        features: ["2 Mock Exams", "Expert Q&A", "8-week block"],
        link: "/courses/easa-modular"
    }
];

export default function CoursesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="Our Training Programmes"
          subtitle="From full-time licensure to flexible modular exams, choose the path that fits your career goals."
          backgroundImage="/aircraft-engine-crossection.jpg"
        />

        {/* Main Content */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courseList.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col">
                        <div className="bg-aerojet-blue p-4 text-white flex justify-between items-center">
                            <span className="font-bold text-lg opacity-80">Option {course.id}</span>
                            <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">{course.price}</span>
                        </div>
                        <div className="p-8 grow flex flex-col">
                            <h3 className="text-xl font-bold text-aerojet-blue mb-3">{course.title}</h3>
                            <p className="text-gray-600 text-sm mb-6 grow">{course.desc}</p>
                            
                            <ul className="space-y-2 mb-8">
                                {course.features.map(f => (
                                    <li key={f} className="flex items-start text-xs text-gray-500">
                                        <span className="text-aerojet-sky mr-2">✔</span> {f}
                                    </li>
                                ))}
                            </ul>

                            <Link href={course.link} className="block w-full text-center bg-gray-50 hover:bg-aerojet-sky hover:text-white border border-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors">
                                View Details
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </section>

        {/* Next Steps CTA */}
        <section className="py-16 bg-white border-t border-gray-200">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-2xl font-bold text-aerojet-blue mb-4">Ready to Enroll?</h2>
                <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-8">
                    <div className="p-4 bg-gray-50 rounded">1. Pay Registration Fee</div>
                    <div className="p-4 bg-gray-50 rounded">2. Submit Application</div>
                    <div className="p-4 bg-gray-50 rounded">3. Pay Deposit</div>
                    <div className="p-4 bg-gray-50 rounded">4. Start Training</div>
                </div>
                <Link href="/register" className="bg-aerojet-gold text-aerojet-blue px-10 py-4 rounded-md font-bold text-lg hover:bg-opacity-90 transition">
                    Start Registration Now
                </Link>
            </div>
        </section>

      </div>
      <Footer />
    </main>
  );
}
