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

async function getArticle(slug: string): Promise<Article> {
  const query = `*[_type == "article" && slug.current == $slug][0] {
    title, mainImage, category, publishedAt, body
  }`;
  // Ensure we don't send an 'undefined' slug
  if (!slug) return notFound();
  const article = await client.fetch(query, { slug });
  return article;
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const awaitedParams = await params; // Fix for Next.js promise-based params
  const article = await getArticle(awaitedParams.slug);

  if (!article) {
    return notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar theme="light" />
      <div className="grow pt-20">
        <header className="container mx-auto px-6 py-12 text-center">
          <p className="text-sm font-bold text-aerojet-sky uppercase">{article.category}</p>
          <h1 className="text-3xl md:text-5xl font-bold text-aerojet-blue mt-2 mb-4 max-w-4xl mx-auto">{article.title}</h1>
          <p className="text-gray-500">{new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </header>
        <div className="relative w-full h-64 md:h-96 lg:h-500px mb-12">
          <Image
            src={urlFor(article.mainImage).url()}
            alt={article.title}
            layout="fill"
            objectFit="cover"
            priority
          />
        </div>
        <article className="container mx-auto px-6 pb-20 max-w-3xl">
          <div className="prose lg:prose-lg max-w-none">
            <PortableText value={article.body} />
          </div>
        </article>
      </div>
      <Footer />
    </main>
  );
}
