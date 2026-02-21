import Link from 'next/link';
import Image from 'next/image';

const programs = [
  {
    title: "Full-Time Licence Programmes",
    description: "Comprehensive 2 or 4-year pathways to B1.1/B2 licensure. Includes theory, hand-skills, and work experience.",
    image: "/fulltime.jpg", // Updated Hero Image
    link: "/courses/easa-full-time",
    badge: "Most Popular",
    ratio: "aspect-video" 
  },
  {
    title: "12-Month Crash Course",
    description: "Accelerated B1.1 certification for industry professionals. Theory & exams only.",
    image: "/12month.jpg",
    link: "/courses/easa-full-time",
    badge: "Industry",
    ratio: "aspect-video"
  },
  {
    title: "Modular Training",
    description: "Individual tuition + exam per module. Book tuition and exams for specific modules at your own pace.",
    image: "/modular1.jpg", // New High-Res Image
    link: "/courses/easa-modular",
    badge: "Individual",
    ratio: "aspect-video" // Standard Video Ratio
  },
  {
    title: "Exam-Only & Revision",
    description: "Self-study candidates can book exam sittings or join 8-week group revision blocks.",
    image: "/examonly1.jpg", // New High-Res Image
    link: "/courses/examination-only",
    badge: "Self-Study",
    ratio: "aspect-video" // Standard Video Ratio
  }
];

export default function ProgramsSnapshot() {
  return (
    <section className="py-24 md:py-32 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-aerojet-blue uppercase tracking-tight mb-4">
            Find Your Path in Aviation
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            From complete beginners to experienced technicians, we have a certified pathway for you.
          </p>
        </div>

        {/* Use a 2-column grid on small screens, 2-column on medium, and 4-column on large */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {programs.map((program) => (
            <Link 
                href={program.link} 
                key={program.title} 
                className="group block bg-white rounded-4xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 border border-slate-100"
            >
              {/* Dynamic Aspect Ratio Container */}
              <div className={`relative w-full ${program.ratio} bg-slate-200`}>
                <Image
                  src={program.image}
                  alt={program.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-aerojet-sky/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    {program.badge}
                </div>
              </div>
              
              <div className="p-8">
                <h3 className="text-lg font-black text-aerojet-blue mb-3 uppercase tracking-tight leading-tight group-hover:text-aerojet-sky transition-colors">
                  {program.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6">
                  {program.description}
                </p>
                <div className="flex items-center text-aerojet-sky font-black uppercase text-[10px] tracking-widest">
                    Learn More
                    <span className="ml-2 transform group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
