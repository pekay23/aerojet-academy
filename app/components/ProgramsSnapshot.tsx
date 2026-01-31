import Link from 'next/link';
import Image from 'next/image';

const programs = [
  {
    title: "Full-Time EASA Part-66 B1/B2",
    description: "A comprehensive, multi-year program for aspiring licensed aircraft maintenance engineers.",
    image: "/4-yrFull-time.jpg",
    link: "/courses/easa-full-time",
    status: "Active"
  },
  {
    title: "Modular EASA Part-66",
    description: "Flexible, self-paced learning. Book and sit for individual exam modules at your convenience.",
    image: "/hero-modular.jpg",
    link: "/courses/easa-modular",
    status: "Active"
  },
  {
    title: "Pilot Training",
    description: "Express your interest in our future flight training programs, from private to commercial licenses.",
    image: "/female-pilot.jpg",
    link: "/contact?interest=pilot",
    status: "Coming Soon"
  },
  {
    title: "Cabin Crew Training",
    description: "Register your interest for our upcoming safety and service excellence course for cabin crew.",
    image: "/air-hoster.jpg",
    link: "/contact?interest=cabin-crew",
    status: "Coming Soon"
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
            We offer structured training for licensed engineers, with pilot and cabin crew programs on the horizon.
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
                  objectFit="contain"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                {program.status === 'Coming Soon' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg uppercase tracking-widest">COMING SOON</span>
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
