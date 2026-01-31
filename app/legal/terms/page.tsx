import Link from 'next/link';
// Use the @ alias to avoid relative path errors
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50 pt-20">
      <Navbar theme="light" />
      
      <div className="grow container mx-auto px-6 py-12 max-w-4xl"> {/* Changed flex-grow to grow per Tailwind suggestion */}
        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100">
          
          <h1 className="text-3xl md:text-4xl font-bold text-aerojet-blue mb-2">
            Online Application Terms & Conditions
          </h1>
          <p className="text-gray-500 mb-10 text-sm">
            Last Updated: {new Date().getFullYear()}
          </p>

          <div className="prose prose-blue max-w-none text-gray-700">
            {/* ... Content remains the same ... */}
            <p>
              Please read these terms carefully before submitting your registration or application to Aerojet Aviation Training Academy. By proceeding, you agree to be bound by the policies outlined below.
            </p>

            <h3 className="text-aerojet-blue font-bold text-xl mt-8 mb-4">1. Registration Fee Policy</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>The <strong>Registration Fee</strong> is a mandatory, one-time administrative payment required to initiate your application process.</li>
              <li>This fee covers the cost of background verification, document review, and setting up your secure student portal account.</li>
              <li><strong>The Registration Fee is strictly non-refundable</strong> under any circumstances, regardless of whether your application is subsequently approved or rejected.</li>
            </ul>

            <h3 className="text-aerojet-blue font-bold text-xl mt-8 mb-4">2. Application & Verification Process</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Submission of an application does not guarantee admission. All applicants must meet the entry requirements and pass internal assessments.</li>
              <li>Aerojet Academy reserves the right to request additional documentation or verify the authenticity of any document provided.</li>
              <li>False declarations or forged documents will result in immediate disqualification and a permanent ban from future applications.</li>
            </ul>

            <h3 className="text-aerojet-blue font-bold text-xl mt-8 mb-4">3. Seat Confirmation Deposit & Fees</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Upon approval of your application, you will be issued a Seat Confirmation Invoice.</li>
              <li><strong>Full-Time Students:</strong> A deposit of <strong>40% of the total tuition fee</strong> is required to secure your seat in the cohort.</li>
              <li><strong>Exam-Only Students:</strong> The <strong>full fee</strong> for the selected module(s) is required to secure your seat.</li>
              <li>Your seat is <strong>not secured</strong> until this payment is made in full and confirmed by our finance team.</li>
              <li>If you withdraw your application after paying the deposit but before the course commences, a cancellation fee may apply as per the full Student Agreement provided upon enrollment.</li>
            </ul>

            <h3 className="text-aerojet-blue font-bold text-xl mt-8 mb-4">4. Program Availability & Cohort Starts</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Minimum Cohort Size:</strong> Training for any specific intake will commence only when the minimum required number of enrolled students is met.</li>
              <li>In the event that a cohort does not reach the minimum size, Aerojet Academy reserves the right to defer the start date to the next available intake.</li>
              <li>Enrolled students will be notified of their official start date via the Student Portal and email.</li>
            </ul>

            <h3 className="text-aerojet-blue font-bold text-xl mt-8 mb-4">5. Communications</h3>
            <p>
              By registering, you consent to receive official communications regarding your application, invoices, and academic status via the email address provided and the Student Portal. It is your responsibility to check these channels regularly.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="font-semibold text-aerojet-blue">
                Do you have questions about these terms?
              </p>
              <p className="mt-2">
                Contact our admissions team at{' '}
                <a href="mailto:admissions@aerojet-academy.com" className="text-aerojet-sky hover:underline">
                  admissions@aerojet-academy.com
                </a>
              </p>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
