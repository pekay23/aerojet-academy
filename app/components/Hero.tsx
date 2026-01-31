import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative h-screen w-full flex items-center justify-start bg-black overflow-hidden">
      {/* High-quality Video or Image Background */}
      <div 
        className="absolute inset-0 z-0 scale-105"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Palo Alto Style Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-black via-black/60 to-transparent z-10" />

      {/* Content Area */}
      <div className="container mx-auto px-8 relative z-20 mt-20">
        <div className="max-w-2xl">
          <div className="w-20 h-1 bg-aerojet-gold mb-6" />
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tighter">
            THE FUTURE <br/> OF <span className="text-aerojet-gold">FLIGHT.</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-lg font-light leading-relaxed">
            Elevate your potential with the region's premier aviation academy. Professional certifications in Engineering, Piloting, and Safety.
          </p>
          
          <div className="flex space-x-6">
            <Link href="/courses" className="group flex items-center bg-white text-black px-8 py-4 font-bold uppercase text-sm tracking-widest hover:bg-aerojet-gold transition">
              Explore Programs
              <span className="ml-2 transform group-hover:translate-x-2 transition">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white rounded-full" />
        </div>
      </div>
    </section>
  );
}
