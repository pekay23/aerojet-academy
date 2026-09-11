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

export function PageViewsTable({ data }: PageViewsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Pages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 font-medium">Page</th>
                <th className="text-right py-2 px-4 font-medium">Views</th>
                <th className="text-right py-2 px-4 font-medium">Unique Visitors</th>
                <th className="text-right py-2 px-4 font-medium">Avg Views/Visitor</th>
              </tr>
            </thead>
            <tbody>
              {data.pages.map((page) => (
                <tr key={page.path} className="border-b last:border-0">
                  <td className="py-2 px-4">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">{page.path}</code>
                  </td>
                  <td className="text-right py-2 px-4">{page.views.toLocaleString()}</td>
                  <td className="text-right py-2 px-4">{page.uniqueVisitors.toLocaleString()}</td>
                  <td className="text-right py-2 px-4">
                    <Badge variant={page.avgViewsPerVisitor > 1.5 ? 'default' : 'secondary'}>
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
export default PageViewsTable;
