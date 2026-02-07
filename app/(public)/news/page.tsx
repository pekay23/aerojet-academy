import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';

export const metadata: Metadata = {
  title: 'Newsroom',
};

async function getArticles() {
  const query = `*[_type == "article" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    slug,
    mainImage,
    category,
    publishedAt
  }`;
  return await client.fetch(query);
}

export default async function NewsroomPage() {
  const articles = await getArticles();

  return (
    <main className="min-h-screen flex flex-col bg-slate-50">     
      <div className="grow">
        <PageHero 
          title="News & Updates"
          subtitle="Stay informed about our latest intakes, partnerships, and facility milestones."
          backgroundImage="/news.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {articles.map((article: any) => (
              <Link 
                href={`/news/${article.slug.current}`} 
                key={article._id} 
                className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 flex flex-col"
              >
                <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
                  <Image 
                    src={urlFor(article.mainImage).url()} 
                    alt={article.title} 
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                    <p className="text-[10px] font-black text-aerojet-sky uppercase tracking-widest">{article.category}</p>
                  </div>
                </div>
                
                <div className="p-8 grow flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    {new Date(article.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <h3 className="text-xl font-black text-aerojet-blue leading-tight mb-4 group-hover:text-aerojet-sky transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <div className="mt-auto pt-4 flex items-center text-aerojet-sky font-black uppercase text-[10px] tracking-[0.2em]">
                    Read Full Story
                    <span className="ml-2 transform group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
