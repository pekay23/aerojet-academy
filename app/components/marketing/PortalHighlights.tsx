import Image from 'next/image';
import Link from 'next/link';

const highlights = [
  {
    icon: "📊",
    title: "Real-Time Tracking",
    description: "Monitor your attendance percentage, lateness conversions, and practical hours logged in real-time."
  },
  {
    icon: "🪑",
    title: "Exam & Seat Allocation",
    description: "Book EASA modules, receive official seat allocations, and view your results the moment they are published."
  },
  {
    icon: "💳",
    title: "Financial Control",
    description: "Manage payments, view your complete financial ledger, and track due dates with full transparency."
  },
];

export default function PortalHighlights() {
  return (
    <section className="bg-aerojet-sky text-white py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Image Side */}
          <div className="relative w-full h-80 md:h-450px rounded-lg overflow-hidden shadow-2xl">
            <Image 
              src="/student.jpg" // A professional image of a focused student
              alt="Aerojet Academy Student using the portal"
              layout="fill"
              objectFit="cover"
            />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Text Content Side */}
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              Track your progress, from day one to certification.
            </h2>
            <p className="text-gray-200 mb-8">
              Our portal gives you a transparent view of your entire academic journey: courses, exam bookings, seat allocations, results, attendance, and practical hours.
            </p>

            <div className="space-y-6">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start">
                  <div className="text-2xl mr-4">{item.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-gray-300 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link href="/portal/login" className="bg-white text-aerojet-blue px-8 py-3 rounded-md font-bold hover:bg-gray-200 transition">
                Go to Portal Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
