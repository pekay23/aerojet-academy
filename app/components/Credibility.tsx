import Image from 'next/image';

const partners = [
  { name: 'EASA', src: '/easa-logo.png', width: 120, height: 40 },
  { name: 'USTDA', src: '/ustda.jpg', width: 150, height: 40 },
  { name: 'Ghana Air Force', src: '/Airforce-logo.png', width: 65, height: 65 }, // Increased size
  { name: 'Joramco', src: '/Joramco-Logo-AI.png', width: 150, height: 35 },     // Replaced logo
  { name: 'Gaptek', src: '/Logotip-GAPTEK.jpg', width: 140, height: 40 },       // Added logo
  { name: 'Aerojet Foundation', src: '/foundation-logo.png', width: 130, height: 40 },
];

export default function Credibility() {
  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto px-6 text-center">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">
          Our Partners & Standards
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-6 md:gap-x-16">
          {partners.map((partner) => (
            <div key={partner.name} className="grayscale hover:grayscale-0 transition duration-300 opacity-70 hover:opacity-100">
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
