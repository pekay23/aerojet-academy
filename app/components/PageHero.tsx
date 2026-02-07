import Image from "next/image";

type PageHeroProps = {
  title: string;
  subtitle: string;
  backgroundImage: string;
};

export default function PageHero({ title, subtitle, backgroundImage }: PageHeroProps) {
  return (
    // 1. INCREASED HEIGHT: Changed h-[70vh] to h-[85vh] to "zoom out" the image
    <section className="relative w-full h-[60vh] md:h-[60vh] flex items-center justify-center bg-slate-950 overflow-hidden">
      
      <Image
        src={backgroundImage}
        alt={title}
        fill
        priority
        // 2. POSITION ADJUSTMENT: Added 'object-top' to prioritize the top of the photo (heads/faces)
        className="object-cover object-center opacity-50"
        quality={100} 
      />

      {/* GRADIENT OVERLAYS */}
      <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />
      <div className="absolute inset-0 bg-black/10 z-10" />

      {/* TEXT CONTENT */}
      <div className="relative container mx-auto px-6 text-center text-white z-20 pt-24 md:pt-32">
        <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-8 drop-shadow-2xl">
                {title}
            </h1>
            <div className="w-24 h-2 bg-aerojet-sky mx-auto mb-8 rounded-full shadow-lg" />
            <p className="text-lg md:text-2xl text-slate-200 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-md">
                {subtitle}
            </p>
        </div>
      </div>
    </section>
  );
}
