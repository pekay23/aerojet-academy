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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aerojet-academy.com'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      status: true,
      publishedAt: true,
      customPublishedAt: true,
      updatedAt: true,
      customAuthorName: true,
      tags: true,
    },
  })

  const isScheduledFuture = !!article?.publishedAt && article.publishedAt.getTime() > Date.now()
  if (!article || article.status !== 'PUBLISHED' || isScheduledFuture) {
    return { title: 'Article Not Found | Aerojet Academy' }
  }

  const url = `${SITE_URL}/newsroom/${slug}`
  const image = article.coverImage || undefined
  const description = article.excerpt || undefined
  const published = (article.customPublishedAt || article.publishedAt || undefined)?.toISOString()

  return {
    title: `${article.title} | Aerojet Academy Newsroom`,
    description,
    keywords: article.tags,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url,
      siteName: 'Aerojet Academy',
      images: image ? [{ url: image }] : undefined,
      publishedTime: published,
      authors: article.customAuthorName ? [article.customAuthorName] : undefined,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

async function getArticleAndIncrementViews(slug: string) {
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

  const isScheduledFuture = !!article?.publishedAt && article.publishedAt.getTime() > Date.now()
  if (!article || article.status !== 'PUBLISHED' || isScheduledFuture) return null

  // Increment views in background
  try {
    await prisma.newsArticle.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    })
  } catch (err) {
    console.error('Failed to increment view count', err)
  }

  return article
}

function calculateReadTime(content: string) {
  // Average adult reading speed: ~200-250 words per minute
  // Use 225 words per minute as a reasonable average (matching aerojet-aviation)
  const wordsPerMinute = 225
  const words = content.trim().split(/\s+/).filter(Boolean).length
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

  const publishedIso = (
    article.customPublishedAt ||
    article.publishedAt ||
    article.createdAt
  )?.toISOString()
  const imageUrl = article.coverImage || null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt || undefined,
    image: imageUrl ? [`${SITE_URL}${imageUrl}`] : undefined,
    datePublished: publishedIso,
    dateModified: article.updatedAt?.toISOString(),
    author: { '@type': 'Organization', name: authorName },
    publisher: {
      '@type': 'Organization',
      name: 'Aerojet Academy',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logos/logo-footer.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/newsroom/${slug}` },
    keywords: article.tags?.join(', '),
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          <div className="bg-aerojet-blue absolute inset-0" />
        )}

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex items-end pb-12 sm:pb-20">
          <div className="mx-auto w-full px-6">
            <div className="max-w-7xl pt-32 sm:pt-48">
              {/* Category Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mb-6 flex gap-2">
                  {article.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-aerojet-sky rounded-full px-3 py-1 text-xs font-bold text-white shadow-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="mb-8 text-4xl leading-[1.05] font-black tracking-tighter text-white sm:text-6xl md:text-7xl">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-xs font-bold tracking-widest text-slate-200 uppercase">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                    <UserIcon className="text-aerojet-sky h-3.5 w-3.5" />
                  </div>
                  <span>{authorName}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                    <Calendar className="text-aerojet-sky h-3.5 w-3.5" />
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
                    <Clock className="text-aerojet-sky h-3.5 w-3.5" />
                  </div>
                  <span>{readTime} Min Read</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                    <Eye className="text-aerojet-sky h-3.5 w-3.5" />
                  </div>
                  <span>{article.viewCount} Views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content Area - using max-w-5xl to match aerojet-aviation width */}
      <div className="relative mx-auto max-w-5xl px-6 py-20">
        <article>
          {/* Top Back Link */}
          <Link
            href="/newsroom"
            className="text-aerojet-sky hover:text-aerojet-blue mb-8 inline-flex items-center gap-2 font-bold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Newsroom
          </Link>

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
                    className="hover:border-aerojet-sky hover:text-aerojet-blue rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-black tracking-widest text-slate-400 uppercase transition-all hover:bg-white dark:border-slate-800 dark:bg-slate-900"
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
              className="group hover:text-aerojet-blue flex items-center gap-3 text-sm font-black tracking-widest text-slate-400 uppercase transition-all dark:hover:text-white"
            >
              <div className="group-hover:border-aerojet-sky group-hover:bg-aerojet-sky flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 transition-all group-hover:text-white dark:border-slate-800 dark:bg-slate-900">
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
