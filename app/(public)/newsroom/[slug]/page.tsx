import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'
import { Eye, Clock, Calendar, User as UserIcon, ArrowLeft } from 'lucide-react'
import ShareButtons from '../_components/ShareButtons'
import { getBaseUrl } from '@/lib/utils/url'
import { sanitizeHtml } from '@/lib/utils/sanitize'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await prisma.newsArticle.findUnique({ where: { slug } })
  if (!article || article.status !== 'PUBLISHED') return { title: 'Article Not Found' }
  return { title: article.title, description: article.excerpt || '' }
}

async function getArticleAndIncrementViews(slug: string) {
  // Update view count and get article
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          profile: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  })

  if (!article || article.status !== 'PUBLISHED') return null

  // Increment views in background
  await prisma.newsArticle.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } },
  })

  return article
}

function calculateReadTime(content: string) {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export default async function NewsroomArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticleAndIncrementViews(slug)

  if (!article) {
    notFound()
  }

  const readTime = calculateReadTime(article.content)
  const authorName =
    article.customAuthorName ||
    (article.author?.profile
      ? `${article.author.profile.firstName} ${article.author.profile.lastName}`
      : 'Aerojet Academy')

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950">
      {/* Immersive Hero Section */}
      {/* Immersive Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden sm:h-[70vh]">
        {article.coverImage ? (
          <>
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            {/* Sophisticated Overlay Gradient */}
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-aerojet-blue" />
        )}

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex items-end pb-12 sm:pb-20">
          <div className="mx-auto w-full px-6">
            <div className="max-w-7xl pt-32 sm:pt-48">
              <h1 className="mb-8 text-4xl leading-[1.05] font-black tracking-tighter text-white sm:text-6xl md:text-7xl">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-xs font-bold tracking-widest text-slate-200 uppercase">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                    <UserIcon className="h-3.5 w-3.5 text-aerojet-sky" />
                  </div>
                  <span>{authorName}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                    <Calendar className="h-3.5 w-3.5 text-aerojet-sky" />
                  </div>
                  <span>
                    {new Date(
                      article.customPublishedAt || article.publishedAt || article.createdAt
                    ).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                    <Clock className="h-3.5 w-3.5 text-aerojet-sky" />
                  </div>
                  <span>{readTime} Min Read</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                    <Eye className="h-3.5 w-3.5 text-aerojet-sky" />
                  </div>
                  <span>{article.viewCount} Views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content Area */}
      <div className="mx-auto max-w-4xl px-6 py-20 relative">
        <article>
          <div
            className="prose prose-slate prose-lg prose-headings:text-aerojet-blue prose-headings:font-black prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-aerojet-blue prose-a:text-aerojet-sky prose-a:font-bold prose-a:no-underline hover:prose-a:underline dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />

          {/* Social Share & Tags Section */}
          <div className="mt-16 flex flex-col items-center justify-between gap-8 border-t border-slate-100 pt-12 sm:flex-row">
            {/* Article Tags */}
            <div className="flex flex-wrap gap-2">
              {article.tags &&
                article.tags.length > 0 &&
                article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-black tracking-widest text-slate-400 uppercase transition-all hover:border-aerojet-sky hover:bg-white hover:text-aerojet-blue dark:border-slate-800 dark:bg-slate-900"
                  >
                    #{tag}
                  </span>
                ))}
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
                Share Article
              </span>
              <ShareButtons
                url={`${await getBaseUrl()}/newsroom/${article.slug}`}
                title={article.title}
              />
            </div>
          </div>

          {/* Back to Newsroom - Bottom */}
          <div className="mt-20 flex justify-center">
            <Link
              href="/newsroom"
              className="group flex items-center gap-3 text-sm font-black tracking-widest text-slate-400 uppercase transition-all hover:text-aerojet-blue dark:hover:text-white"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 transition-all group-hover:border-aerojet-sky group-hover:bg-aerojet-sky group-hover:text-white dark:border-slate-800 dark:bg-slate-900">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span>Back to Newsroom</span>
            </Link>
          </div>
        </article>
      </div>

    </div>
  )
}
