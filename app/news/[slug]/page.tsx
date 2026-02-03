import { PortableText } from '@portabletext/react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';

interface Article {
  title: string;
  mainImage: any;
  category: string;
  publishedAt: string;
  body: any[];
}

// Fetch a single article by its slug from Sanity
async function getArticle(slug: string): Promise<Article | null> {
  const query = `*[_type == "article" && slug.current == $slug][0] {
    title, 
    mainImage, 
    category, 
    publishedAt, 
    body
  }`;
  
  try {
    const article = await client.fetch(query, { slug });
    return article;
  } catch (error) {
    console.error("Sanity Fetch Error:", error);
    return null;
  }
}

// Next.js 15 requirement: params must be treated as a Promise
export default async function ArticlePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  // Await the params to extract the slug
  const { slug } = await params;

  if (!slug) return notFound();

  const article = await getArticle(slug);

  if (!article) {
    return notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar theme="light" />
      
      <div className="grow pt-20">
        {/* Article Header */}
        <header className="container mx-auto px-6 py-12 text-center">
          <p className="text-sm font-bold text-aerojet-sky uppercase tracking-widest">
            {article.category}
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-aerojet-blue mt-4 mb-6 max-w-4xl mx-auto tracking-tight leading-tight">
            {article.title}
          </h1>
          <p className="text-slate-400 font-medium">
            {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}
          </p>
        </header>

        {/* Hero Image */}
        <div className="relative w-full h-64 md:h-96 lg:h-125 mb-16 shadow-inner bg-slate-100">
          <Image
            src={urlFor(article.mainImage).url()}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Article Content */}
        <article className="container mx-auto px-6 pb-24 max-w-3xl">
          <div className="prose prose-slate lg:prose-xl max-w-none prose-headings:text-aerojet-blue prose-a:text-aerojet-sky">
            <PortableText value={article.body} />
          </div>
        </article>
      </div>

      <Footer />
    </main>
  );
}
