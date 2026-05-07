import { redirect } from 'next/navigation'

// All imports below are used by the commented-out full page.
// import { Metadata } from 'next'
// import { getAuthSession } from '@/lib/auth/helpers'
// import { prismaUnfiltered } from '@/lib/prisma/client'
// import { FileText, Download, Sparkles, Receipt, Calendar, CreditCard } from 'lucide-react'
// import { formatCurrency } from '@/lib/currency'
// import { format } from 'date-fns'
// import { Badge } from '@/components/ui/badge'

// Feature hidden — invoice workflow not finalized yet.
// To re-enable: remove the redirect and uncomment the full page below.
export default async function StudentInvoicesPage() {
  redirect('/student/wallet')
}

/*
export default async function StudentInvoicesPageFull() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')

  const invoices = await prismaUnfiltered.invoice.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue sm:text-4xl dark:text-white">
            Financial Records
          </h1>
          <p className="flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-5 w-5 text-aerojet-sky" />
            Manage your invoices and payment history.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {invoices.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Receipt className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-sm font-medium text-slate-400">No invoices found on your account.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-aerojet-blue dark:text-slate-300">
                        {inv.invoiceNumber || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(inv.createdAt, 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                        Academy Fees
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        {formatCurrency(Number(inv.amount), inv.currency || 'EUR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-black uppercase ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                        }`}
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/api/student/invoices/${inv.id}/download`}
                        className="inline-flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2 text-xs font-black text-white transition-all hover:bg-aerojet-sky hover:shadow-lg active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
*/
