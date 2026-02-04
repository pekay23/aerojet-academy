import Image from 'next/image';

const partners = [
  { name: 'EASA', src: '/easa-logo.png', width: 120, height: 40 },
  { name: 'USTDA', src: '/ustda.jpg', width: 120, height: 40 },
  { name: 'Ghana Air Force', src: '/Airforce-logo.png', width: 120, height: 40 },
  { name: 'Joramco', src: '/Joramco-Logo-AI.png', width: 120, height: 35 },
  { name: 'Gaptek', src: '/Logotip-GAPTEK.jpg', width: 120, height: 40 },
  { name: 'Aerojet Foundation', src: '/foundation-logo.png', width: 130, height: 40 },
];

export default function Credibility() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="container mx-auto px-6 text-center">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">
          Partners & Certification Standards
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 md:gap-x-20">
          {partners.map((partner) => (
            <div key={partner.name} className="grayscale hover:grayscale-0 transition-all duration-500 opacity-60 hover:opacity-100 transform hover:scale-105">
              <Image
                src={partner.src}
                alt={partner.name}
                width={partner.width}
                height={partner.height}
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
