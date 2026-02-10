import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/app/components/marketing/PageHero';
import Link from 'next/link';
import { CheckCircle2, Users, AlertCircle, Calendar, MonitorPlay } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Modular Training Programme',
  description: 'Flexible Assisted Learning for EASA Part-66 Modules.',
};

export default function ModularPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="grow">
        <PageHero 
            title="Modular Training Program"
            subtitle="Study at your own pace. Book specific EASA B1 or B2 Modules to fit your schedule."
            backgroundImage="/modular.jpg"
        />

        <div className="container mx-auto px-6 py-20">
             <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-12">
                
                {/* LEFT CONTENT */}
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Flexibility & Focus</h2>
                        <p className="text-lg text-slate-700 leading-relaxed mb-6">
                            This course option allows for a bit more flexibility than the rigorous full-time four-year training program. 
                            With the modular training program, you can <strong>study at your own pace</strong> by booking any of the EASA B1 or B2 Modules.
                        </p>
                        <p className="text-slate-700 mb-6">
                            Once you choose and pay for a selected course, you will receive the corresponding <strong>learning materials</strong> for that module and be able to book the most convenient exam date of your choice using the scheduled exam slots available from our portal after your registration.
                        </p>
                        
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-8">
                             <h4 className="font-bold text-aerojet-blue mb-3 text-lg">Who is this for?</h4>
                             <p className="text-sm text-slate-600 mb-4">This option is ideal for:</p>
                             <ul className="space-y-3 text-slate-600">
                                <li className="flex gap-2 items-start"><CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5"/> <div>Candidates that may already be <strong>working full-time in a different industry</strong> that want to pursue a career in the aircraft maintenance industry while still working.</div></li>
                                <li className="flex gap-2 items-start"><CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5"/> <div>Non-licensed or trainee mechanics <strong>working with an airline</strong> but looking to obtain their EASA license while they continue to work.</div></li>
                             </ul>
                        </div>
                    </section>

                    {/* Detailed Benefits from PDF */}
                    <section>
                        <h3 className="text-xl font-bold text-aerojet-blue mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#4c9ded]"/> Programme Features
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <Calendar className="w-6 h-6 text-aerojet-blue mb-3"/>
                                <h5 className="font-bold text-slate-900 mb-2">Flexible Tuition Slots</h5>
                                <p className="text-sm text-slate-600">
                                    You will be able to book for <strong>evening or weekend classroom tuition slots</strong> at your convenience.
                                </p>
                            </div>
                            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <MonitorPlay className="w-6 h-6 text-aerojet-blue mb-3"/>
                                <h5 className="font-bold text-slate-900 mb-2">Exam Prep Sessions</h5>
                                <p className="text-sm text-slate-600">
                                    Benefit from a <strong>2 to 3-hour handy tips and pre-exam brush-up sessions</strong> right before each exam for every module you book.
                                </p>
                            </div>
                            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <Users className="w-6 h-6 text-aerojet-blue mb-3"/>
                                <h5 className="font-bold text-slate-900 mb-2">Online Info Sessions</h5>
                                <p className="text-sm text-slate-600">
                                    Join some online info sessions for your selected module if one is organised in that period.
                                </p>
                            </div>
                        </div>
                    </section>
                    
                    {/* Important Disclaimer */}
                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 flex gap-4">
                        <AlertCircle className="w-8 h-8 text-orange-600 shrink-0" />
                        <div>
                            <strong className="block text-orange-900 mb-1">Important Note</strong>
                            <p className="text-sm text-orange-800 leading-relaxed">
                                This modular program does <strong>NOT</strong> come with work experience or practical training. Candidates must meet the EASA experience requirements independently.
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="space-y-8">
                     <div className="p-8 rounded-3xl bg-aerojet-blue text-white shadow-xl relative overflow-hidden">
                          <div className="relative z-10">
                            <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">Portal Access</span>
                            <div className="text-3xl font-black mt-2 mb-1">Lifetime Access</div>
                            <p className="text-sm opacity-80 mt-4 mb-8">
                                Gaining access to our portal only requires a <strong>one-time registration</strong>. Once registered, you have lifetime access to buy and book as many training programs and courses as you wish.
                            </p>
                            <Link href="/register" className="block w-full text-center bg-[#4c9ded] text-white mt-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-aerojet-blue transition-all">
                                Register Now
                            </Link>
                          </div>
                     </div>
                </div>

             </div>
        </div>
      </div>
    </main>
  );
}
