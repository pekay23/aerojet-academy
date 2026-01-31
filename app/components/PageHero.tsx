type PageHeroProps = {
  title: string;
  subtitle: string;
  backgroundImage: string;
};

export default function PageHero({ title, subtitle, backgroundImage }: PageHeroProps) {
  return (
    <section className="relative py-24 md:py-32 bg-black">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
      <div className="relative container mx-auto px-6 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>
        <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">{subtitle}</p>
      </div>
    </section>
  );
}
