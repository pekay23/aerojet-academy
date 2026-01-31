import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PageHero from '../../components/PageHero';

const modules = [
  { id: "M1", title: "Mathematics" },
  { id: "M2", title: "Physics" },
  { id: "M3", title: "Electrical Fundamentals" },
  { id: "M4", title: "Electronic Fundamentals" },
  { id: "M5", title: "Digital Techniques" },
  { id: "M6", title: "Materials & Hardware" },
  { id: "M7", title: "Maintenance Practices" },
  { id: "M8", title: "Basic Aerodynamics" },
  { id: "M9", title: "Human Factors" },
  { id: "M10", title: "Aviation Legislation" },
  { id: "M11", title: "Aeroplane Aerodynamics, Structures & Systems" },
  { id: "M12", title: "Helicopter Aerodynamics, Structures & Systems" },
  { id: "M13", title: "Aircraft Aerodynamics, Structures & Systems" },
  { id: "M14", title: "Propulsion" },
  { id: "M15", title: "Gas Turbine Engine" },
  { id: "M16", title: "Piston Engine" },
  { id: "M17", title: "Propeller" },
];

const pathways = [
    { name: "B1.1", title: "Aeroplanes Turbine", required: "M1-M11, M15, M17" },
    { name: "B1.2", title: "Aeroplanes Piston", required: "M1-M11, M16, M17" },
    { name: "B1.3", title: "Helicopters Turbine", required: "M1-M10, M12, M13, M15" },
    { name: "B1.4", title: "Helicopters Piston", required: "M1-M10, M12, M13, M16" },
    { name: "B2", title: "Avionics", required: "M1-M10, M13, M14" },
];

export default function ModulesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="EASA Part-66 Module List"
          subtitle="Explore the 17 standard modules required for B1/B2 license certification."
          backgroundImage="/undercarage.jpg"
        />

        <div className="py-20">
          <div className="container mx-auto px-6">

            {/* Pathways Section */}
            <section className="mb-20">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-aerojet-blue mb-4">Module Pathways</h2>
                    <p className="text-gray-600 mb-10">Each license category requires a specific combination of modules. Find your path below.</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pathways.map(path => (
                        <div key={path.name} className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                            <h3 className="text-lg font-bold text-aerojet-sky">{path.name} <span className="text-gray-500 font-normal">- {path.title}</span></h3>
                            <p className="font-mono text-sm text-gray-800 mt-2">{path.required}</p>
                        </div>
                    ))}
                </div>
            </section>
            
            {/* Full Module List */}
            <section>
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-aerojet-blue mb-4">Complete Module List</h2>
                    <p className="text-gray-600 mb-12">Register today to gain access to our student portal where you can book exams for any of the modules listed below.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 max-w-5xl mx-auto">
                    {modules.map(mod => (
                        <div key={mod.id} className="flex items-center p-3">
                            <span className="font-bold text-aerojet-sky w-12">{mod.id}</span>
                            <span className="text-gray-700">{mod.title}</span>
                        </div>
                    ))}
                </div>
            </section>

             {/* CTA Section */}
            <section className="mt-20 text-center">
                <Link href="/register" className="bg-aerojet-gold text-aerojet-blue px-10 py-4 rounded-md font-bold text-lg hover:bg-opacity-90 transition">
                    Register to Access Module Booking
                </Link>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
