import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PageHero from '../../components/PageHero';

export default function ModularCoursePage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-grow">
        <PageHero 
          title="Modular EASA Part-66 Program"
          subtitle="A flexible, self-paced approach to achieving your B1/B2 license certification."
          backgroundImage="/module-top.jpg"
        />

        <div className="py-20">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-12">
              
              <div className="lg:col-span-2">
                <section>
                  <h2 className="text-2xl font-bold text-aerojet-blue mb-4">Program Overview</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The Modular EASA Part-66 Program is designed for maximum flexibility. It is the ideal solution for individuals who are already working in the industry, prefer a self-study approach, or wish to complete the required modules at their own pace.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    You can book and sit for individual module exams through our student portal. Upon successful payment and registration, you gain access to the relevant study materials to prepare for your exams.
                  </p>
                </section>

                <section className="mt-12">
                  <h2 className="text-2xl font-bold text-aerojet-blue mb-4">How It Works</h2>
                   <ol className="list-decimal list-inside space-y-4 text-gray-700">
                        <li><span className="font-bold text-gray-800">Register:</span> Pay the one-time registration fee to create your student portal account.</li>
                        <li><span className="font-bold text-gray-800">Book:</span> Log in to the portal and select the specific exam module(s) you wish to take.</li>
                        <li><span className="font-bold text-gray-800">Pay & Prepare:</span> Pay for your selected module(s) and upload proof. Once verified, access to study materials is granted.</li>
                        <li><em className="font-bold text-gray-800">Sit for the Exam:</em> Attend your scheduled exam at our certified facility.</li>
                   </ol>
                </section>

                 <div className="mt-12 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
                    <h3 className="font-bold text-yellow-800">Important: 24-Month Rule</h3>
                    <p className="text-sm text-yellow-700">
                        Please be aware that all required modules for a specific license category must be successfully passed within a 24-month period, starting from the date you pass your first module exam.
                    </p>
                </div>
              </div>

              <aside className="lg:col-span-1">
                <div className="sticky top-28 bg-gray-50 p-8 rounded-xl border border-gray-200">
                  <h3 className="text-xl font-bold text-aerojet-blue mb-6">Program at a Glance</h3>
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase">Category</h4>
                    <p className="font-semibold text-gray-800">EASA Part-66 Modular</p>
                  </div>
                   <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase">Pacing</h4>
                    <p className="font-semibold text-gray-800">Self-Paced, Pay-per-Module</p>
                  </div>
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-500 uppercase">Booking</h4>
                    <p className="font-semibold text-gray-800">Via Student Portal</p>
                  </div>
                  <Link href="/register" className="w-full text-center block bg-aerojet-gold text-aerojet-blue px-6 py-3 rounded-md font-bold hover:bg-opacity-90 transition">
                    Register to Get Started
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
