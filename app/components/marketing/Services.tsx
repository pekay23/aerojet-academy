import Link from "next/link";

const services = [
  {
    title: "Pilot Training",
    description: "From PPL to ATPL. Train in modern glass-cockpit aircraft with experienced instructors.",
    icon: "✈️",
    link: "/courses/pilot"
  },
  {
    title: "Engineering",
    description: "EASA Part-66 certified training. Master airframe, powerplant, and avionics systems.",
    icon: "⚙️",
    link: "/courses/engineering"
  },
  {
    title: "Cabin Crew",
    description: "World-class safety and service training to launch your career with top airlines.",
    icon: "👔",
    link: "/courses/cabin-crew"
  }
];

export default function Services() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-aerojet-blue mb-4">
            Our Training Programs
          </h2>
          <div className="w-20 h-1 bg-aerojet-sky mx-auto rounded-full"></div> {/* Uses new color */}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="group p-8 border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
              <div className="text-4xl mb-6 bg-blue-50 w-16 h-16 flex items-center justify-center rounded-xl group-hover:bg-aerojet-sky group-hover:text-white transition-colors duration-300">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-aerojet-blue mb-3 group-hover:text-aerojet-sky transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {service.description}
              </p>
              <Link href={service.link} className="inline-flex items-center text-aerojet-sky font-semibold hover:text-aerojet-blue transition-colors">
                Learn more <span className="ml-2">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
