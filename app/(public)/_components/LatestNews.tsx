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
  } catch (e) {
    console.error('LatestNews fetch error:', e)
    errorMsg = e instanceof Error ? e.message : 'Unknown error'
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
    <section className="bg-paper py-20 sm:py-28 dark:bg-[#1b2430]">
      <div className="container mx-auto w-full px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <span className="mb-2 block text-xs font-bold tracking-[0.2em] text-[#1b2430]/60 uppercase">
              Updates
            </span>
            <h2 className="text-aerojet-blue font-serif text-3xl font-medium sm:text-4xl dark:text-white">
              Latest News & Updates
            </h2>
          </div>
          <Link
            href="/newsroom"
            className="text-aerojet-blue hidden items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all hover:gap-3 sm:inline-flex"
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
