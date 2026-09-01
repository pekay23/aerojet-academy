'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PageViewsTableProps {
  data: {
    pages: Array<{
      path: string
      views: number
      uniqueVisitors: number
      avgViewsPerVisitor: number
    }>
  }
}

export default function PageViewsTable({ data }: PageViewsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Top Pages
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Page</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Views</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Unique Visitors</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Views/Visitor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.pages.map((page) => (
                <tr key={page.path} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <code className="text-xs rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {page.path}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{page.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold">{page.uniqueVisitors.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge
                      variant={page.avgViewsPerVisitor > 1.5 ? 'default' : 'secondary'}
                      className="rounded-lg font-bold"
                    >
                      {page.avgViewsPerVisitor.toFixed(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
