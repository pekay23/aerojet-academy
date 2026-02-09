import Link from 'next/link';

export default function HomeContact() {
  return (
    <section className="bg-slate-900 py-24 px-6">
      <div className="max-w-5xl mx-auto rounded-[3rem] bg-aerojet-sky p-8 md:p-16 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-10">
        
        {/* Decorative Background Icon */}
        <div className="absolute -bottom-10 -right-10 opacity-10">
            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16.5C21 16.88 20.79 17.21 20.47 17.38L12.57 21.82C12.41 21.94 12.21 22 12 22C11.79 22 11.59 21.94 11.43 21.82L3.53 17.38C3.21 17.21 3 16.88 3 16.5V7.5C3 7.12 3.21 6.79 3.53 6.62L11.43 2.18C11.59 2.06 11.79 2 12 2C12.21 2 12.41 2.06 12.57 2.18L20.47 6.62C20.79 6.79 21 7.12 21 7.5V16.5Z" /></svg>
        </div>

        <div className="relative z-10 text-center lg:text-left">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">
            Ready to Begin?
          </h2>
          <p className="text-blue-100 text-lg font-medium max-w-lg leading-relaxed">
            Contact our admissions team today to request your registration invoice or to ask any questions about our 2026/2027 schedule.
          </p>
          <div className="mt-8 flex flex-col md:flex-row gap-6 text-sm font-bold uppercase tracking-widest">
            <a href="tel:+233209848423" className="flex items-center gap-2 hover:text-aerojet-blue transition"><span>📞</span> +233-20-984-8423</a>
            <a href="mailto:trainingprograms@aerojet-academy.com" className="flex items-center gap-2 hover:text-aerojet-blue transition"><span>✉️</span> Email Admissions</a>
          </div>
        </div>

        <div className="relative z-10 shrink-0 flex flex-col gap-4 w-full md:w-auto">
          <Link href="/register" className="bg-white text-aerojet-blue px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-center shadow-xl hover:bg-slate-900 hover:text-white transition-all">
            Start Registration
          </Link>
          <Link href="/contact" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-center hover:bg-white/20 transition-all">
            General Enquiry
          </Link>
        </div>
      </div>
    </section>
  );
}
