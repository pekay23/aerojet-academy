import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PageHero from '../../components/PageHero';

export default function FeesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="Fees & Payment Milestones"
          subtitle="A transparent overview of the investment required for your aviation training."
          backgroundImage="/techSupport.jpg"
        />
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-aerojet-blue mb-6">Transparent Fee Structure</h2>
            <p className="text-gray-700 mb-10">We believe in a clear and upfront fee structure with no hidden costs. Below are the key payment milestones for our Full-Time programs. Fees for modular exams are paid on a per-module basis via the student portal.</p>

            <div className="border-t border-gray-200">
                <div className="py-6 border-b border-gray-200 grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><h3 className="font-bold text-aerojet-blue text-lg">1. Registration Fee</h3></div>
                    <div className="md:col-span-2"><p className="text-gray-600">A one-time, non-refundable fee required to process your application and grant access to our online application form. This fee must be paid before your application can be reviewed.</p></div>
                </div>
                <div className="py-6 border-b border-gray-200 grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><h3 className="font-bold text-aerojet-blue text-lg">2. Seat Confirmation</h3></div>
                    <div className="md:col-span-2"><p className="text-gray-600">Approved applicants will receive a Seat Confirmation Invoice. For <strong>Full-Time courses</strong>, a 40% deposit is required to secure your place. For <strong>Exam-Only</strong> options, the full fee is required to secure your seat.</p></div>
                </div>
                <div className="py-6 border-b border-gray-200 grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><h3 className="font-bold text-aerojet-blue text-lg">3. Remaining Balance</h3></div>
                    <div className="md:col-span-2"><p className="text-gray-600">For Full-Time students, the remaining 60% of the tuition is payable in scheduled installments. A detailed payment plan will be provided to you upon enrollment. All fees must be settled before the commencement of each term.</p></div>
                </div>
            </div>
            <p className="text-sm text-gray-500 mt-8">Note: All payments are to be made via bank transfer. Proof of payment must be uploaded to the student portal for verification.</p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
