import { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await prisma.newsArticle.findUnique({ where: { slug } })
  if (!article || article.status !== 'PUBLISHED') return { title: 'Article Not Found' }
  return { title: article.title, description: article.excerpt || '' }
}

async function getArticle(slug: string) {
  return await prisma.newsArticle.findUnique({
    where: { slug },
  })
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article || article.status !== 'PUBLISHED') return notFound()

  return (
    <div className="bg-white pt-24 text-slate-900">
      <header className="mx-auto mb-12 max-w-4xl border-b border-slate-50 px-6 py-12 text-center">
        <div className="mb-6 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-[10px] font-black tracking-[0.2em] text-[#4c9ded] uppercase">
          Announcement
        </div>
        <h1 className="mx-auto max-w-4xl text-3xl leading-[1.1] font-black tracking-tighter text-[#002a5c] dark:text-white sm:text-5xl">
          {article.title}
        </h1>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
          <span>By Aerojet Admissions</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>
            {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </header>

      {article.coverImage && (
        <div className="mx-auto mb-14 max-w-5xl px-6">
          <div className="relative aspect-video overflow-hidden rounded-2xl border-4 border-slate-100 shadow-2xl sm:rounded-3xl">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      <article className="mx-auto max-w-3xl px-6 pb-28">
        <div className="prose prose-slate prose-lg prose-headings:text-[#002a5c] prose-headings:font-black prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-[#002a5c] prose-a:text-[#4c9ded] prose-a:font-bold prose-a:no-underline hover:prose-a:underline max-w-none">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
        <div className="mt-16 border-t border-slate-100 pt-8 text-center">
          <p className="mb-5 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Interested in our programmes?
          </p>
          <Link
            href="/register"
            className="inline-block rounded-xl bg-[#4c9ded] px-10 py-4 text-xs font-black tracking-widest text-white uppercase transition-all hover:bg-[#002a5c]"
          >
            Begin Your Application
          </Link>
        </div>
      </article>
    </div>
  )
}
