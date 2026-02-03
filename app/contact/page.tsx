import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import ContactForm from '@/components/ContactForm'; // Import the client form

export const metadata: Metadata = {
  title: 'Contact',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <Navbar theme="dark" />
      
      <div className="grow">
        <PageHero 
          title="Contact Us"
          subtitle="Reach out to our admissions team for enquiries about EASA programmes."
          backgroundImage="/airport.jpg"
        />

        <div className="container mx-auto px-6 py-16 -mt-24 relative z-20">
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden grid lg:grid-cols-5 border border-slate-100">
            
            {/* LEFT: Info & Map */}
            <div className="lg:col-span-2 bg-aerojet-blue p-8 md:p-12 text-white">
                <h2 className="text-2xl font-black uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Get in Touch</h2>
                
                <div className="space-y-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">📍</div>
                        <div>
                            <h3 className="font-bold text-aerojet-sky text-xs uppercase tracking-widest mb-1">Campus Location</h3>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                ATTC Small Engines Department,<br/> 
                                Kokomlemle, Accra, Ghana
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">📞</div>
                        <div>
                            <h3 className="font-bold text-aerojet-sky text-xs uppercase tracking-widest mb-1">Admissions Line</h3>
                            <p className="text-sm text-slate-300 font-medium">+233-20-984-8423</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">✉️</div>
                        <div>
                            <h3 className="font-bold text-aerojet-sky text-xs uppercase tracking-widest mb-1">Official Email</h3>
                            <p className="text-sm text-slate-300 font-medium">trainingprograms@aerojet-academy.com</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 h-60 rounded-3xl overflow-hidden border border-white/10 grayscale opacity-70">
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.786377777076!2d-0.2085864241476562!3d5.598254333214875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf90a079636901%3A0x8772a4667556553a!2sAccra%20Technical%20Training%20Centre!5e0!3m2!1sen!2sgh!4v1709220000000!5m2!1sen!2sgh" 
                        width="100%" height="100%" style={{border:0}} allowFullScreen={true} loading="lazy" 
                    ></iframe>
                </div>
            </div>

            {/* RIGHT: Form */}
            <div className="lg:col-span-3 p-8 md:p-12 bg-white">
                 <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-2">Send us a Message</h2>
                 <p className="text-slate-500 mb-10">Fill out the form below and we will get back to you via email.</p>
                 <ContactForm />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
