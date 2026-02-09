import { Metadata } from 'next';
import { PortableText } from '@portabletext/react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link'; // <--- ADD THIS LINE
import Navbar from '@/app/components/marketing/Navbar';
import Footer from '@/app/components/marketing/Footer';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';

type Props = {
  params: Promise<{ slug: string }>;
};
// --- DYNAMIC METADATA ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await client.fetch(`*[_type == "article" && slug.current == $slug][0]{title, summary}`, { slug });
  
  if (!article) return { title: "Article Not Found" };

  return {
    title: article.title,
    description: article.summary,
  };
}

async function getArticle(slug: string) {
  const query = `*[_type == "article" && slug.current == $slug][0] {
    title, 
    mainImage, 
    category, 
    publishedAt, 
    body
  }`;
  return await client.fetch(query, { slug });
}

export default async function ArticlePage({ params }: Props) {
  // Await params for Next.js 15
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) return notFound();

  return (
    <main className="bg-white text-slate-900 min-h-screen pt-24">   
      <div className="grow pt-24">
        {/* Article Header */}
        <header className="container mx-auto px-6 py-12 text-center border-b border-slate-50 mb-12">
          <div className="inline-block bg-blue-50 text-aerojet-sky px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            {article.category}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-aerojet-blue max-w-4xl mx-auto tracking-tighter leading-[1.1]">
            {article.title}
          </h1>
          <div className="mt-8 flex items-center justify-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
            <span>By Aerojet Admissions</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>{new Date(article.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        {/* Hero Image */}
        <div className="container mx-auto px-6 max-w-6xl mb-16">
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
                <Image
                    src={urlFor(article.mainImage).url()}
                    alt={article.title}
                    fill
                    className="object-cover"
                    priority
                />
            </div>
        </div>

        {/* Article Body */}
        <article className="container mx-auto px-6 pb-32 max-w-3xl">
          <div className="prose prose-slate prose-lg lg:prose-xl max-w-none 
            prose-headings:text-aerojet-blue prose-headings:font-black prose-headings:tracking-tight
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-strong:text-aerojet-blue prose-strong:font-black
            prose-a:text-aerojet-sky prose-a:font-bold prose-a:no-underline hover:prose-a:underline">
            <PortableText value={article.body} />
          </div>
          
          <div className="mt-20 pt-10 border-t border-slate-100 text-center">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">Interested in our programmes?</p>
            <Link href="/register" className="bg-aerojet-sky text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-aerojet-blue transition-all shadow-lg">
                Begin Your Application
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
