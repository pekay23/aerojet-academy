import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { unstable_cache } from 'next/cache'
import NewsCard from './NewsCard'

const getRecentArticles = unstable_cache(
  async () => {
    return await prisma.newsArticle.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    })
  },
  ['latest-news-homepage'],
  { revalidate: 3600, tags: ['news'] }
)

export default async function LatestNews() {
  let articles: Awaited<ReturnType<typeof getRecentArticles>> = []
  let errorMsg = null

  try {
    articles = await getRecentArticles()
  } catch (e: any) {
    console.error('LatestNews fetch error:', e)
    errorMsg = e.message
  }

  if (errorMsg) {
    return (
      <section className="bg-slate-50 py-10 dark:bg-slate-900/10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-red-500">ERROR: Failed to load news. {errorMsg}</p>
        </div>
      </section>
    )
  }

  if (!articles || articles.length === 0) {
    return null
  }

  return (
    <section className="bg-slate-50 py-20 sm:py-28 dark:bg-slate-900/10">
      <div className="container mx-auto w-full px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <span className="text-public-secondary mb-2 block text-xs font-bold tracking-[0.2em] uppercase">
              Updates
            </span>
            <h2 className="text-public-primary text-3xl font-black tracking-tight uppercase sm:text-4xl dark:text-white">
              Latest News & Updates
            </h2>
          </div>
          <Link
            href="/newsroom"
            className="text-public-secondary hidden items-center gap-2 text-xs font-black tracking-widest uppercase transition-all hover:gap-3 sm:inline-flex"
          >
            View All News <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => {
            const wordsPerMinute = 200
            const words = (article.content || '').trim().split(/\s+/).length
            const readTime = Math.ceil(words / wordsPerMinute)

            return (
              <NewsCard
                key={article.id}
                title={article.title}
                slug={article.slug}
                image={
                  article.coverImage ||
                  'https://gx1g03nvpo.ufs.sh/f/d9OGsE12ZLmuYHcsu6EdTXKJmiU25PHpnqh9N1zWk0QucfeF'
                }
                date={new Date(
                  article.customPublishedAt || article.publishedAt || article.createdAt
                ).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                readTime={readTime}
                viewCount={article.viewCount}
                excerpt={article.excerpt}
                index={i}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
