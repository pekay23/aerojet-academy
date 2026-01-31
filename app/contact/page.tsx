import Link from 'next/link';
// Use @ alias for imports
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50 pt-20">
      <Navbar theme="light" />
      <div className="grow container mx-auto px-6 py-16">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-aerojet-blue">Contact Us</h1>
            <p className="mt-2 text-lg text-gray-600">We're here to help. Reach out with your questions.</p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
                <h2 className="text-2xl font-bold text-aerojet-blue mb-6">Get in Touch</h2>
                <div className="space-y-4 text-gray-700">
                    <div className="flex items-start">
                        <span className="font-bold text-aerojet-sky w-8 mt-1">📍</span>
                        <div><h3 className="font-semibold">Address</h3><p>Accra Technical Training Centre (ATTC), Kokomlemle – Accra</p></div>
                    </div>
                    <div className="flex items-start">
                        <span className="font-bold text-aerojet-sky w-8 mt-1">📞</span>
                        <div><h3 className="font-semibold">Phone</h3><p>+233 551 010 108</p></div>
                    </div>
                    <div className="flex items-start">
                        <span className="font-bold text-aerojet-sky w-8 mt-1">✉️</span>
                        <div><h3 className="font-semibold">Email</h3><p>trainingprograms@aerojet-academy.com</p></div>
                    </div>
                </div>
                 {/* Google Map Embed for ATTC Accra */}
                <div className="mt-8 h-64 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.786377777076!2d-0.2085864241476562!3d5.598254333214875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf90a079636901%3A0x8772a4667556553a!2sAccra%20Technical%20Training%20Centre!5e0!3m2!1sen!2sgh!4v1709220000000!5m2!1sen!2sgh" 
                        width="100%" 
                        height="100%" 
                        style={{border:0}} 
                        allowFullScreen={true} 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            </div>
            {/* Contact Form */}
            <div>
                 <h2 className="text-2xl font-bold text-aerojet-blue mb-6">Send us a Message</h2>
                 <form action="#" method="POST" className="space-y-6">
                    <div>
                        <label htmlFor="name" className="font-semibold text-sm text-gray-700">Full Name</label>
                        <input type="text" name="name" id="name" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-aerojet-sky focus:border-aerojet-sky"/>
                    </div>
                     <div>
                        <label htmlFor="email" className="font-semibold text-sm text-gray-700">Email Address</label>
                        <input type="email" name="email" id="email" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-aerojet-sky focus:border-aerojet-sky"/>
                    </div>
                     <div>
                        <label htmlFor="message" className="font-semibold text-sm text-gray-700">Message</label>
                        <textarea name="message" id="message" rows={5} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-aerojet-sky focus:border-aerojet-sky"></textarea>
                    </div>
                    <div>
                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-aerojet-blue hover:bg-aerojet-sky transition">
                            Send Message
                        </button>
                    </div>
                 </form>
            </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
