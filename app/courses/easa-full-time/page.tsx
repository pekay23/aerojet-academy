import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PageHero from '../../components/PageHero';
import NextSteps from "@/components/NextSteps"; // Import
const requirements = [
  "Minimum 18 years of age",
  "High school diploma (or equivalent), with strong passes in Maths & Physics",
  "Proficiency in the English language",
  "Successful completion of Aerojet Academy's entry assessment"
];

const feeStructure = [
    { title: "Registration Fee", description: "Covers verification and administrative processing. Paid before application is released." },
    { title: "Seat Confirmation Deposit", description: "40% of total tuition, due after your application is approved to secure your place." },
    { title: "Remaining Balance", description: "Payable in scheduled installments before the start of each term. Details provided upon enrollment." }
];

export default function FullTimeCoursePage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="Full-Time EASA Part-66 Program (B1/B2)"
          subtitle="An immersive, structured pathway to becoming a licensed Aircraft Maintenance Engineer."
          backgroundImage="/AirCraftEng.jpg"
        />

        <div className="py-20">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-12">
              
              {/* Main Content Column */}
              <div className="lg:col-span-2">
                {/* Overview */}
                <section>
                  <h2 className="text-2xl font-bold text-aerojet-blue mb-4">Program Overview</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our Full-Time EASA Part-66 program is the definitive pathway for individuals seeking a career as a certified aircraft maintenance engineer. This comprehensive course covers all the theoretical knowledge and practical skills required for B1 (Mechanical) and B2 (Avionics) license categories.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Taught by experienced industry professionals at our Accra campus, the curriculum is designed to not only meet but exceed EASA standards, ensuring you are fully prepared for a global career in aircraft maintenance.
                  </p>
                </section>

                {/* Training Structure */}
                <section className="mt-12">
                  <h2 className="text-2xl font-bold text-aerojet-blue mb-4">Training Structure</h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    The program is delivered through a blend of classroom-based theory, interactive workshops, and extensive hands-on practical training in our state-of-the-art facilities. You will progress through the EASA modules in a logical, term-based structure.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                          <h3 className="font-bold text-aerojet-sky mb-2">Theoretical Knowledge</h3>
                          <p className="text-sm text-gray-600">In-depth lectures covering all 17 EASA modules, from Mathematics and Physics to Turbine Engines and Propulsion.</p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                          <h3 className="font-bold text-aerojet-sky mb-2">Practical Hand-Skills</h3>
                          <p className="text-sm text-gray-600">Develop essential workshop skills and real-world maintenance techniques under expert supervision.</p>
                      </div>
                  </div>
                </section>

                {/* Entry Requirements */}
                <section className="mt-12">
                    <h2 className="text-2xl font-bold text-aerojet-blue mb-4">Entry Requirements</h2>
                    <ul className="space-y-3">
                        {requirements.map(req => (
                            <li key={req} className="flex items-center text-gray-700">
                                <span className="text-aerojet-sky font-bold text-xl mr-3">✔</span>
                                {req}
                            </li>
                        ))}
                    </ul>
                </section>
              </div>

              {/* Sidebar Column */}
              <aside className="lg:col-span-1">
                <div className="sticky top-28 bg-gray-50 p-8 rounded-xl border border-gray-200">
                  <h3 className="text-xl font-bold text-aerojet-blue mb-6">Course at a Glance</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase">Category</h4>
                    <p className="font-semibold text-gray-800">EASA Part-66 Full-Time</p>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase">Pathways</h4>
                    <p className="font-semibold text-gray-800">B1.1, B1.2, B1.3, B1.4, B2</p>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase">Next Intake</h4>
                    <p className="font-semibold text-gray-800">September 2026 (TBC)</p>
                  </div>

                  <Link href="/register" className="w-full text-center block bg-aerojet-gold text-aerojet-blue px-6 py-3 rounded-md font-bold hover:bg-opacity-90 transition">
                    Start Registration
                  </Link>
                  <p className="text-xs text-gray-500 mt-3 text-center">Registration fee required to apply.</p>
                </div>
              </aside>

            </div>

             {/* Fees Section */}
             <section className="mt-20 pt-16 border-t border-gray-200">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-aerojet-blue mb-4">Fees & Payment Milestones</h2>
                    <p className="text-gray-600 mb-10">Our fee structure is designed to be transparent, allowing you to plan your investment in your aviation career.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {feeStructure.map(fee => (
                        <div key={fee.title} className="text-center p-6">
                            <h3 className="text-xl font-bold text-aerojet-sky mb-2">{fee.title}</h3>
                            <p className="text-sm text-gray-600">{fee.description}</p>
                        </div>
                    ))}
                </div>
            </section>

          </div>
        </div>
      </div>
      <NextSteps />
      <Footer />
    </main>
  );
}
