import Link from 'next/link';
import Image from 'next/image';

const programs = [
  {
    title: "Full-Time Licence Programmes",
    description: "Comprehensive 2 or 4-year pathways to B1.1/B2 licensure. Includes theory, hand-skills, and work experience.",
    image: "/4-yrFull-time.jpg",
    link: "/courses",
    badge: "Most Popular"
  },
  {
    title: "12-Month Crash Course",
    description: "Accelerated B1.1 certification for industry professionals. Theory & exams only.",
    image: "/1-yrFull-time.jpg", // Ensure this image exists, or use another
    link: "/courses",
    badge: "Industry"
  },
  {
    title: "Modular Training",
    description: "Pay-as-you-go. Book tuition and exams for specific modules at your own pace.",
    image: "/hero-modular.jpg",
    link: "/courses/easa-modular",
    badge: "Flexible"
  },
  {
    title: "Exam-Only & Revision",
    description: "Self-study candidates can book exam seats or join 8-week revision clinics.",
    image: "/self-study.jpg", // Ensure image exists
    link: "/courses/exams",
    badge: "Self-Study"
  }
];

export default function ProgramsSnapshot() {
  return (
    <section className="py-20 md:py-28 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-aerojet-blue mb-4">
            Find Your Path in Aviation
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From complete beginners to experienced technicians, we have a structured pathway for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {programs.map((program) => (
            <Link href={program.link} key={program.title} className="group block bg-white rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2">
              <div className="relative h-56 w-full bg-gray-200">
                <Image
                  src={program.image}
                  alt={`Image for ${program.title}`}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                {program.badge && (
                  <div className="absolute top-4 right-4 bg-aerojet-sky text-white text-xs font-bold px-3 py-1 rounded shadow-sm">
                    {program.badge}
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-aerojet-blue mb-2 group-hover:text-aerojet-sky transition-colors">
                  {program.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {program.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
