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
          title="Fees & Payment Rules"
          subtitle="Transparent pricing for our world-class aviation programmes."
          backgroundImage="/techSupport.jpg"
        />
        
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            
            {/* 1. Mandatory Registration */}
            <section className="bg-blue-50 border border-blue-100 p-8 rounded-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-aerojet-blue">Mandatory Registration Fee</h2>
                        <p className="text-gray-600 mt-2">Required for all applicants before the application form is released.</p>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-lg shadow-sm border border-blue-100">
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">One-Time Fee</span>
                        <span className="text-3xl font-black text-aerojet-sky">GHS 350.00</span>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-blue-200/50 grid md:grid-cols-2 gap-8 text-sm text-gray-700">
                    <div>
                        <h4 className="font-bold mb-2">What this covers:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Administrative processing</li>
                            <li>Background verification checks</li>
                            <li>Creation of your Student Portal account</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">Payment Method:</h4>
                        <p>Bank Transfer Only. You will receive an invoice with bank details upon submitting your enquiry.</p>
                    </div>
                </div>
            </section>

            {/* 2. Programme Fees Table */}
            <section>
                <h2 className="text-3xl font-bold text-aerojet-blue mb-8">Programme Tuition Fees</h2>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-800 font-bold uppercase text-xs border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-20">Code</th>
                                <th className="p-4">Programme Name</th>
                                <th className="p-4 text-right">Fee (EUR)</th>
                                <th className="p-4">Payment Structure</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-gray-50">
                                <td className="p-4 font-mono font-bold text-aerojet-sky">A</td>
                                <td className="p-4 font-bold text-slate-700">Four-Year Full-Time (B1.1 & B2)</td>
                                <td className="p-4 text-right font-mono">€13,500 <span className="text-xs text-gray-400 block">/ year</span></td>
                                <td className="p-4 text-gray-600">40% Deposit to confirm seat. Balance in 2 installments.</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="p-4 font-mono font-bold text-aerojet-sky">B</td>
                                <td className="p-4 font-bold text-slate-700">Two-Year Full-Time (B1.1)</td>
                                <td className="p-4 text-right font-mono">€11,250 <span className="text-xs text-gray-400 block">/ year</span></td>
                                <td className="p-4 text-gray-600">40% Deposit to confirm seat. Balance in 2 installments.</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="p-4 font-mono font-bold text-aerojet-sky">C</td>
                                <td className="p-4 font-bold text-slate-700">12-Month Crash Course</td>
                                <td className="p-4 text-right font-mono">€9,540 <span className="text-xs text-gray-400 block">total</span></td>
                                <td className="p-4 text-gray-600">40% Deposit. Balance in 2 installments.</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="p-4 font-mono font-bold text-aerojet-sky">D</td>
                                <td className="p-4 font-bold text-slate-700">Modular Training</td>
                                <td className="p-4 text-right font-mono">Varies</td>
                                <td className="p-4 text-gray-600">100% upfront per module booked in portal.</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="p-4 font-mono font-bold text-aerojet-sky">E</td>
                                <td className="p-4 font-bold text-slate-700">Examination-Only Seat</td>
                                <td className="p-4 text-right font-mono">€520 <span className="text-xs text-gray-400 block">/ exam</span></td>
                                <td className="p-4 text-gray-600">50% Deposit to book. Balance by T-14 days.</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="p-4 font-mono font-bold text-aerojet-sky">F</td>
                                <td className="p-4 font-bold text-slate-700">Revision Support</td>
                                <td className="p-4 text-right font-mono">€120 <span className="text-xs text-gray-400 block">/ module</span></td>
                                <td className="p-4 text-gray-600">Full payment required to join 8-week block.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 3. Payment Rules & Policies */}
            <section className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-aerojet-blue mb-4">Banking Instructions</h3>
                    <p className="text-gray-600 mb-4 text-sm">
                        Aerojet Academy does not accept cash payments on campus. All fees must be paid via bank transfer to our official corporate account.
                    </p>
                    <div className="bg-gray-50 p-4 rounded text-sm font-mono text-gray-700 space-y-2">
                        <p><strong>Bank:</strong> [Bank Name]</p>
                        <p><strong>Account Name:</strong> Aerojet Aviation</p>
                        <p><strong>Account No:</strong> [Number]</p>
                        <p><strong>Branch:</strong> [Branch]</p>
                        <p><strong>Swift Code:</strong> [Code]</p>
                    </div>
                    <p className="text-xs text-red-500 mt-4 italic">* Please use your Student Name or Applicant ID as the reference.</p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-aerojet-blue mb-4">Refund & Cancellation Policy</h3>
                    <ul className="space-y-4 text-sm text-gray-600">
                        <li className="flex items-start gap-3">
                            <span className="text-red-500 font-bold">●</span> 
                            <span>The <strong>GHS 350 Registration Fee</strong> is strictly non-refundable.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-red-500 font-bold">●</span> 
                            <span><strong>Seat Confirmation Deposits (40%)</strong> are non-refundable once the cohort has been confirmed and resources allocated.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-red-500 font-bold">●</span> 
                            <span><strong>Exam Fees:</strong> If minimum numbers are not met (60 seats) by T-21, fees will be rolled over to the next window at no cost. Candidate cancellations after T-21 incur a €50 admin fee.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-red-500 mr-0">●</span> 
                            <span>Please refer to the <Link href="/legal/terms" className="text-blue-600 underline">Online Application Terms</Link> for the full legal policy.</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* CTA */}
            <div className="text-center pt-8">
                <p className="text-gray-500 mb-4">Ready to invest in your future?</p>
                <Link href="/register" className="bg-aerojet-sky text-white px-10 py-4 rounded-md font-bold text-lg hover:bg-aerojet-soft-blue transition inline-block shadow-lg">
                    Start Registration
                </Link>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
