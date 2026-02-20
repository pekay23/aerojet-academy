import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { client } from '@/sanity/lib/client'; // Make sure this path is correct
import { urlForImage } from '@/sanity/lib/image'; // Make sure this path is correct

async function getRecentPosts() {
  const query = `*[_type == "post"] | order(_createdAt desc)[0...3] {
    _id,
    title,
    "slug": slug.current,
    mainImage,
    publishedAt
  }`;
  const posts = await client.fetch(query);
  return posts;
}

export default async function LatestNews() {
  const posts = await getRecentPosts();

  if (!posts || posts.length === 0) {
    return null; // Don't render the section if there are no posts
  }

  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <span className="text-public-secondary font-bold text-xs uppercase tracking-[0.2em] mb-2 block">
              Updates
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-public-primary uppercase tracking-tight">
              Latest News & Updates
            </h2>
          </div>
          <Link href="/newsroom" className="hidden sm:inline-flex items-center gap-2 text-public-secondary font-black uppercase text-xs tracking-widest hover:gap-3 transition-all">
            View All News <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: any) => (
            <Link key={post._id} href={`/newsroom/${post.slug}`} className="group block">
              <div className="overflow-hidden rounded-xl">
                <Image
                  src={urlForImage(post.mainImage).width(600).height(400).url()}
                  alt={post.title}
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <h3 className="text-lg font-bold text-public-dark group-hover:text-public-secondary transition-colors">
                  {post.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
