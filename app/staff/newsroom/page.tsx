import { Metadata } from 'next'
import Link from 'next/link'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Plus, Edit, Globe, FileText, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { SortableTh } from '@/components/ui/sortable-th'
import { buildOrderBy } from '@/lib/utils/build-order-by'
import type { Prisma } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Newsroom CMS | Staff Portal',
}

const ALLOWED_SORT_KEYS = {
  title: 'title',
  author: 'author.profile.lastName',
  status: 'status',
  date: 'publishedAt',
} as const
type SortKey = keyof typeof ALLOWED_SORT_KEYS

interface NewsroomPageProps {
  searchParams: Promise<{ sort?: string; order?: string }>
}

async function getArticles(orderBy: Prisma.NewsArticleOrderByWithRelationInput) {
  return await prismaUnfiltered.newsArticle.findMany({
    orderBy,
    include: {
      author: {
        select: { profile: { select: { firstName: true, lastName: true } } },
      },
    },
  })
}

export default async function NewsroomPage({ searchParams }: NewsroomPageProps) {
  const params = await searchParams
  const orderBy = buildOrderBy<SortKey>(params, ALLOWED_SORT_KEYS, { publishedAt: 'desc' })
  const articles = await getArticles(orderBy as Prisma.NewsArticleOrderByWithRelationInput)

  return (
    <div className="mx-auto max-w-450 space-y-8">
      <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight sm:text-4xl dark:text-white">
            Newsroom CMS
          </h1>
          <p className="flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="text-aerojet-sky h-5 w-5" />
            Manage public news, announcements, and academy articles.
          </p>
        </div>
        <Link
          href="/staff/newsroom/create"
          className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white shadow-xl transition-all hover:scale-105 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Article
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/50">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <h3 className="text-aerojet-blue text-sm font-black tracking-widest uppercase dark:text-slate-100">
            Articles Inventory
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
              <tr>
                <SortableTh sortKey="title" label="Article" />
                <SortableTh sortKey="author" label="Author" />
                <SortableTh sortKey="status" label="Status" />
                <SortableTh sortKey="date" label="Date" />
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                        <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="font-bold text-slate-400">
                        No articles found. Create one to get started.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr
                    key={article.id}
                    className="transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <div className="text-aerojet-blue text-base font-black dark:text-slate-100">
                        {article.title}
                      </div>
                      <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                        slug: /{article.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {article.author?.profile?.firstName} {article.author?.profile?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                          article.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : article.status === 'ARCHIVED'
                              ? 'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}
                      >
                        {article.status === 'PUBLISHED' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : article.status === 'ARCHIVED' ? (
                          <Globe className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {article.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-slate-400">
                      {article.publishedAt
                        ? format(new Date(article.publishedAt), 'MMM dd, yyyy')
                        : format(new Date(article.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/staff/newsroom/${article.id}/edit`}
                          className="hover:text-aerojet-blue flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:scale-110 hover:border-blue-100 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-blue-900/20"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
