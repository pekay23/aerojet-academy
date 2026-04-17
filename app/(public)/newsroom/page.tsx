import { Metadata } from 'next'
import Hero from '../_components/Hero'
import NewsCard from '../_components/NewsCard'
import { prisma } from '@/lib/prisma/client'
import NewsPagination from './_components/NewsPagination'

export const metadata: Metadata = { title: 'Newsroom | Aerojet Academy' }

async function getArticles(skip: number, take: number) {
  return await prisma.newsArticle.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    skip,
    take,
  })
}

async function getArticlesCount() {
  return await prisma.newsArticle.count({
    where: { status: 'PUBLISHED' },
  })
}

export default async function NewsroomPage(props: {
  searchParams: Promise<{ page?: string; limit?: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const limit = Number(searchParams.limit) || 9
  const skip = (page - 1) * limit

  const [articles, total] = await Promise.all([
    getArticles(skip, limit),
    getArticlesCount(),
  ])

  return (
    <div className="relative bg-slate-50 min-h-screen">
      <Hero
        title="News & Updates"
        subtitle="Stay informed about our latest intakes, partnerships, and facility milestones."
        backgroundImage="/images/hero/news.webp"
      />

      <div className="mx-auto w-full px-6 py-20 relative">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                tags={article.tags}
                excerpt={article.excerpt}
                index={i}
              />
            )
          })}
        </div>

        {total > 0 && (
          <NewsPagination total={total} page={page} limit={limit} />
        )}

        {articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h3 className="text-xl font-bold text-slate-800">No articles found</h3>
            <p className="mt-2 text-slate-500">Check back later for more updates.</p>
          </div>
        )}
      </div>
    </div>
  )
}
