import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma/client'
import { Plus, Edit, Trash2, Globe, FileText, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = {
  title: 'Newsroom CMS | Aerojet Aviation Academy',
}

async function getArticles() {
  return await prisma.newsArticle.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { profile: { select: { firstName: true, lastName: true } } },
      },
    },
  })
}

export default async function NewsroomPage() {
  const articles = await getArticles()

  return (
    <div className="space-y-6">
      <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Newsroom CMS
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage public news, announcements, and articles.
          </p>
        </div>
        <Link
          href="/staff/newsroom/create"
          className="flex items-center gap-2 rounded-xl bg-[#002a5c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#002a5c]/90 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Article
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Article</th>
                <th className="px-6 py-4 font-semibold">Author</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      <p>No articles found. Create one to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr
                    key={article.id}
                    className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {article.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        /{article.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {article.author?.profile?.firstName} {article.author?.profile?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          article.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : article.status === 'ARCHIVED'
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}
                      >
                        {article.status === 'PUBLISHED' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : article.status === 'ARCHIVED' ? (
                          <Globe className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {article.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      {article.publishedAt
                        ? format(new Date(article.publishedAt), 'MMM dd, yyyy')
                        : format(new Date(article.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/staff/newsroom/${article.id}/edit`}
                          className="flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
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
