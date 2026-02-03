import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHero from '../components/PageHero';
import NextSteps from "@/components/NextSteps"; // Import

const processSteps = [
  { step: 1, title: "Choose Your Program", description: "Select the course that aligns with your career goals, either the Full-Time Program or individual Modular Exams." },
  { step: 2, title: "Pay Registration Fee", description: "Submit an enquiry or proceed directly to registration. An invoice for the non-refundable registration fee will be sent to your email." },
  { step: 3, title: "Complete Online Application", description: "After your payment is confirmed, you will receive a unique link to our detailed online application form." },
  { step: 4, title: "Admissions Review", description: "Our team will carefully review your application and uploaded documents. We may contact you for an interview or additional information." },
  { 
    step: 5, 
    title: "Pay Seat Deposit / Exam Fee", 
    description: "Approved Full-Time applicants receive an invoice for a 40% seat confirmation deposit. For Exam-Only bookings, the full module fee is required to secure your seat." 
  },
  { step: 6, title: "Portal Onboarding", description: "With your seat secured, you will be onboarded into our Student Portal where you can complete your profile and view course details." },
  { step: 7, title: "Start Date Confirmation", description: "Your official start date is confirmed via email and the portal once the course cohort meets the minimum enrollment size." },
];

const documents = [
  "A copy of your Passport or National ID",
  "High School Diploma / Certificate and Transcripts",
  "A recent passport-sized photograph",
  "Proof of English language proficiency (if applicable)"
];

export default function HowToApplyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="How to Apply"
          subtitle="Your clear, step-by-step guide to joining Aerojet Academy."
          backgroundImage="/takeoff.jpg"
        />

        <div className="py-20">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-16">

              {/* Main Content: The Process */}
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-aerojet-blue mb-8">The Application Process</h2>
                
                {/* Corrected Layout using Flexbox */}
                <div className="space-y-8">
                  {processSteps.map(item => (
                    <div key={item.step} className="flex items-start">
                      {/* Step Number Circle */}
                      <div className="shrink-0 w-12 h-12 bg-aerojet-sky rounded-full flex items-center justify-center text-white font-bold text-xl mr-6">
                        {item.step}
                      </div>
                      {/* Step Title and Description */}
                      <div>
                        <h3 className="text-xl font-bold text-aerojet-blue mb-1">{item.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar: Documents and CTA */}
              <aside className="lg:col-span-1">
                <div className="sticky top-28 bg-white p-8 rounded-xl shadow-lg border-t-4 border-aerojet-sky">
                  <h3 className="text-xl font-bold text-aerojet-blue mb-4">Required Documents</h3>
                  <p className="text-sm text-gray-500 mb-6">You will need digital copies of these to complete your application:</p>
    
                  <ul className="space-y-4 mb-8">
                    {documents.map(doc => (
                      <li key={doc} className="flex items-start text-slate-700 text-sm p-3 bg-slate-50 rounded-lg">
                        <span className="text-green-500 font-bold mr-3">✓</span>
                        {doc}
                     </li>
                    ))}
                  </ul>

                  <h3 className="text-xl font-bold text-aerojet-blue mb-4">Ready to Begin?</h3>
                  <Link href="/register" className="w-full text-center block bg-aerojet-gold text-aerojet-blue px-6 py-3 rounded-md font-bold hover:bg-opacity-90 transition">
                    Start Registration Now
                  </Link>
                  <p className="text-xs text-gray-500 mt-3 text-center">This will initiate the invoice for your registration fee.</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
      <NextSteps />
      <Footer />
    </main>
  );
}
