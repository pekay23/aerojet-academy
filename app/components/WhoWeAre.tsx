import Image from 'next/image';

export default function WhoWeAre() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Text Content */}
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-aerojet-blue mb-6">
              We Stand for Excellence
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Aerojet Aviation Training Academy was developed as part of Aerojet’s flagship Accra MRO Project.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our mission is to provide world-class, EASA-standard technical training and create career opportunities for aspiring aviation professionals who otherwise may not have the chance to pursue these highly skilled roles.
            </p>
          </div>

          {/* Image */}
          <div className="relative w-full h-80 md:h-96 rounded-lg overflow-hidden shadow-xl">
            <Image 
              src="/studentsLecture.jpg" // Using an image of students in a classroom
              alt="Students in a lecture at Aerojet Academy"
              layout="fill"
              objectFit="cover"
              className="object-center"
            />
             <div className="absolute inset-0 bg-aerojet-blue/20"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
