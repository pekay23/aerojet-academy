import Link from 'next/link';

export default function HomeContact() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-aerojet-blue mb-4">
          Ready to Start Your Journey in Aviation?
        </h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Contact our admissions team today or begin the registration process to secure your future.
        </p>
        <div className="flex justify-center flex-wrap gap-4">
          <Link href="/register" className="bg-aerojet-sky text-white px-8 py-3 rounded-md font-bold hover:bg-aerojet-soft-blue transition shadow-lg">
            Start Registration
          </Link>

          <Link href="/contact" className="border-2 border-aerojet-sky text-aerojet-sky px-8 py-3 rounded-md font-bold hover:bg-aerojet-sky hover:text-white transition">
            Contact Admissions
          </Link>
        </div>
      </div>
    </section>
  );
}
