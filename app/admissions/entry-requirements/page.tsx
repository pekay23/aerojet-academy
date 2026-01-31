import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PageHero from '../../components/PageHero';

export default function EntryRequirementsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="Entry Requirements"
          subtitle="Ensure you meet the criteria for our EASA-standard training programs."
          backgroundImage="/joystick.jpg"
        />
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-aerojet-blue mb-6">General Applicant Requirements</h2>
            <p className="text-gray-700 mb-8">The following are the minimum requirements for all applicants to be considered for our Full-Time programs. Specific requirements may vary by course.</p>
            
            <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-lg text-aerojet-sky mb-2">Age</h3>
                    <p>Applicants must be a minimum of 18 years old at the time of course commencement.</p>
                </div>
                 <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-lg text-aerojet-sky mb-2">Academic Background</h3>
                    <p>A High School Diploma, WASSCE, or an equivalent secondary school certificate is required. Strong passes in Mathematics, Physics, and English are highly recommended.</p>
                </div>
                 <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-lg text-aerojet-sky mb-2">Language Proficiency</h3>
                    <p>All training is conducted in English. Applicants must demonstrate a satisfactory level of proficiency in reading, writing, and speaking the English language.</p>
                </div>
                 <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-lg text-aerojet-sky mb-2">Aptitude & Assessment</h3>
                    <p>All shortlisted applicants will be required to pass an internal aptitude test designed to assess technical comprehension and suitability for a career in aviation maintenance.</p>
                </div>
            </div>
             <div className="mt-12 text-center p-8 bg-aerojet-blue text-white rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
                <p className="mb-6">If you are unsure about your eligibility, please contact our admissions team for clarification.</p>
                <Link href="/contact" className="bg-white text-aerojet-blue px-8 py-3 rounded-md font-bold hover:bg-gray-200 transition">
                    Contact Admissions
                </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
