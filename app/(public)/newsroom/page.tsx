import { Metadata } from 'next'
import Hero from '../_components/Hero'
import NewsCard from '../_components/NewsCard'
import { prisma } from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Newsroom | Aerojet Academy' }

async function getArticles() {
  return await prisma.newsArticle.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
  })
}

export default async function NewsroomPage() {
  const articles = await getArticles()

  return (
    <div className="bg-slate-50">
      <Hero
        title="News & Updates"
        subtitle="Stay informed about our latest intakes, partnerships, and facility milestones."
        backgroundImage="/images/hero/news.jpg"
      />

      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <NewsCard
              key={article.id}
              title={article.title}
              slug={article.slug}
              image={article.coverImage || '/placeholder-news.jpg'}
              category="Announcement"
              date={new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              index={i}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
