import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHero from '../components/PageHero';

export default function CoursesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="Our Training Courses"
          subtitle="Explore our EASA-standard programs designed to launch your career as a licensed Aircraft Maintenance Engineer."
          backgroundImage="/aircraft-engine-crossection.jpg"
        />

        {/* Main Content: Full-Time vs Modular */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-10">

              {/* Full-Time Card */}
<Link href="/courses/easa-full-time" className="group block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
  {/* Customized container with exact 848/317 aspect ratio */}
  <div className="relative w-full aspect-848/317 bg-gray-100">
    <Image 
      src="/4-yrFull-time.jpg" 
      alt="Full-Time Program" 
      layout="fill" 
      objectFit="cover" // We can safely use cover now because the container matches the image ratio
      className="transition-transform duration-500 group-hover:scale-105"
    />
  </div>
  <div className="p-8">
    <h3 className="text-2xl font-bold text-aerojet-blue mb-3">Full-Time EASA Part-66</h3>
    <p className="text-gray-600 mb-4">A structured, immersive program designed for school leavers and career changers aiming for a B1/B2 license.</p>
    <ul className="text-sm space-y-2 text-gray-700 mb-6">
      <li className="flex items-center"><span className="text-aerojet-sky mr-2">✔</span>Best for a comprehensive, guided path.</li>
      <li className="flex items-center"><span className="text-aerojet-sky mr-2">✔</span>Includes theory, practicals, and exam prep.</li>
      <li className="flex items-center"><span className="text-aerojet-sky mr-2">✔</span>Ideal for building a career from the ground up.</li>
    </ul>
    <span className="font-bold text-aerojet-sky group-hover:text-aerojet-blue">Learn More →</span>
  </div>
</Link>

{/* Modular Card */}
<Link href="/courses/easa-modular" className="group block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
  {/* Customized container with exact 848/317 aspect ratio */}
  <div className="relative w-full aspect-848/317 bg-gray-100">
    <Image 
      src="/hero-modular.jpg" 
      alt="Modular Program" 
      layout="fill" 
      objectFit="cover" // Safe to use cover here too
      className="transition-transform duration-500 group-hover:scale-105"
    />
  </div>
  <div className="p-8">
    <h3 className="text-2xl font-bold text-aerojet-blue mb-3">Modular Part-66 (B1/B2)</h3>
    <p className="text-gray-600 mb-4">A flexible option allowing you to book and complete individual EASA modules at your own pace.</p>
    <ul className="text-sm space-y-2 text-gray-700 mb-6">
      <li className="flex items-center"><span className="text-aerojet-sky mr-2">✔</span>Best for experienced technicians or self-studiers.</li>
      <li className="flex items-center"><span className="text-aerojet-sky mr-2">✔</span>Pay-as-you-go for each module exam.</li>
      <li className="flex items-center"><span className="text-aerojet-sky mr-2">✔</span>Book exams through the student portal.</li>
    </ul>
    <span className="font-bold text-aerojet-sky group-hover:text-aerojet-blue">Learn More →</span>
  </div>
</Link>


            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-aerojet-blue mb-4">Ready to Take the Next Step?</h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Registration is required to apply for our programs or book modular exams. Get started today to unlock the portal and begin your application.</p>
                <Link href="/register" className="bg-aerojet-gold text-aerojet-blue px-10 py-4 rounded-md font-bold text-lg hover:bg-opacity-90 transition">
                    Start Registration
                </Link>
            </div>
        </section>

      </div>
      <Footer />
    </main>
  );
}
