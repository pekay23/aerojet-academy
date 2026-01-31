import Link from 'next/link';
import Navbar from '../components/Navbar'; // Correct path
import Footer from '../components/Footer'; // Correct path

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50 pt-20"> {/* Added pt-20 */}
      <Navbar theme="light" /> {/* Pass the 'light' theme prop */}
      <div className="grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-aerojet-blue">
              Start Your Application Journey
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Registration unlocks your student portal and is the first step toward applying.
            </p>
          </div>
          <div className="rounded-md">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-800">What Registration Unlocks:</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                  <li>Access to the full online application form.</li>
                  <li>A personal portal to track your application status.</li>
                  <li>Direct communication with our admissions team.</li>
                </ul>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  To begin, please provide your primary email address. We will send an invoice for the non-refundable registration fee. Once paid and verified, your portal account will be activated, and the application form will be unlocked.
                </p>
              </div>
              <form className="mt-8 space-y-6" action="#" method="POST">
                <div className="rounded-md shadow-sm -space-y-px">
                  <div>
                    <label htmlFor="email-address" className="sr-only">Email address</label>
                    <input id="email-address" name="email" type="email" autoComplete="email" required 
                      className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-aerojet-sky focus:border-aerojet-sky sm:text-sm" 
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
                <div>
                  <button type="submit" 
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-aerojet-blue hover:bg-aerojet-sky focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aerojet-sky transition">
                    Request Registration Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-gray-500">
            By continuing, you agree to our <Link href="/legal/terms" className="font-medium text-aerojet-blue hover:text-aerojet-sky">Online Application Terms</Link>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
