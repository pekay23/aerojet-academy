import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  growth?: number
  icon: LucideIcon
  color: string
  label: string
}

export default function MetricCard({ title, value, growth, icon: Icon, color, label }: MetricCardProps) {
  const isPositive = (growth || 0) >= 0

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div
        className={`absolute -top-4 -right-4 h-24 w-24 rounded-full opacity-[0.03] transition-transform group-hover:scale-150 ${color}`}
      />

      <div className="relative flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} ring-4 ring-white transition-transform group-hover:scale-110 dark:ring-slate-900`}
        >
          <Icon className="h-6 w-6" />
        </div>

        {growth !== undefined && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
              isPositive
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(growth)}%
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{title}</p>
        <div className="flex items-end justify-between gap-2">
          <h3 className="text-aerojet-blue text-3xl font-black dark:text-slate-100">{value}</h3>
        </div>
        <p className="mt-1 text-xs font-medium text-slate-400">{label}</p>
      </div>
    </div>
  )
}
