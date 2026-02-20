"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, RefreshCw, Wallet } from "lucide-react";
import RevenueChart from "./RevenueChart";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  referenceType?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  user: {
    email: string;
    profile?: { firstName: string; lastName: string } | null;
  };
}

interface FinanceData {
  totalApproved: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  pendingCount: number;
  pendingTotal: number;
  recentTransactions: Transaction[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; style: string }> = {
  APPROVED: { label: "Approved", icon: CheckCircle2, style: "text-emerald-600 bg-emerald-50" },
  PENDING:  { label: "Pending",  icon: Clock,        style: "text-amber-600 bg-amber-50"   },
  REJECTED: { label: "Rejected", icon: XCircle,      style: "text-red-600 bg-red-50"       },
};

export default function FinanceOverview({ chartData }: { chartData: { month: string; revenue: number }[] }) {
  const [data, setData]     = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/finance/overview");
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const monthDiff = data
    ? data.lastMonthRevenue > 0
      ? ((data.monthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100
      : 0
    : 0;
  const isUp = monthDiff >= 0;

  const statCards = [
    {
      label: "Total Revenue (All Time)",
      value: `GHS ${Number(data?.totalApproved ?? 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
      icon: Wallet, bg: "bg-blue-50", color: "text-[#4c9ded]",
    },
    {
      label: "This Month",
      value: `GHS ${Number(data?.monthRevenue ?? 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
      icon: isUp ? TrendingUp : TrendingDown,
      bg: isUp ? "bg-emerald-50" : "bg-red-50",
      color: isUp ? "text-emerald-600" : "text-red-500",
      sub: data ? `${isUp ? "+" : ""}${monthDiff.toFixed(1)}% vs last month` : undefined,
    },
    {
      label: "Pending Payments",
      value: String(data?.pendingCount ?? 0),
      icon: Clock, bg: "bg-amber-50", color: "text-amber-600",
      sub: data ? `GHS ${Number(data.pendingTotal).toLocaleString("en-GH", { minimumFractionDigits: 2 })} awaiting` : undefined,
      href: "/staff/payments/pending",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#002a5c] dark:text-white uppercase tracking-tight">Finance</h1>
          <p className="text-slate-400 text-sm mt-1">Revenue overview and transaction ledger</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 bg-white dark:bg-slate-900 transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          const card = (
            <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex items-start gap-4 ${s.href ? "hover:shadow-md transition-shadow cursor-pointer" : ""}`}>
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-black text-slate-800 dark:text-slate-200">{loading ? "—" : s.value}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                {s.sub && <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>}
              </div>
            </div>
          );
          return s.href
            ? <a key={s.label} href={s.href}>{card}</a>
            : <div key={s.label}>{card}</div>;
        })}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Revenue — Last 6 Months</h2>
            <p className="text-xs text-slate-400 mt-0.5">Approved payments only</p>
          </div>
          <TrendingUp className="w-5 h-5 text-[#4c9ded]" />
        </div>
        {chartData.some((d) => d.revenue > 0) ? (
          <RevenueChart data={chartData} currency="GHS " />
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm font-bold text-slate-300">No revenue data yet</p>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {["User", "Type", "Amount", "Method", "Status", "Date"].map((h) => (
                  <th key={h} className="py-3 px-5 text-[10px] font-black uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3.5 px-5">
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data?.recentTransactions?.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <p className="text-sm font-bold text-slate-400">No transactions yet</p>
                  </td>
                </tr>
              ) : (
                data.recentTransactions.map((tx) => {
                  const fullName = tx.user.profile
                    ? `${tx.user.profile.firstName} ${tx.user.profile.lastName}`
                    : tx.user.email;
                  const cfg = STATUS_CONFIG[tx.status] ?? { label: tx.status, icon: Clock, style: "text-slate-500 bg-slate-50" };
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="text-sm font-bold text-slate-700">{fullName}</p>
                        <p className="text-xs text-slate-400">{tx.user.email}</p>
                      </td>
                      <td className="py-3.5 px-5 text-xs font-bold text-slate-600 dark:text-slate-400">
                        {tx.referenceType?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td className="py-3.5 px-5 text-sm font-black text-[#002a5c]">
                        {tx.currency} {Number(tx.amount).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400">
                        {tx.paymentMethod.replace(/_/g, " ")}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${cfg.style}`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800">
          <a href="/staff/finance/transactions" className="text-xs font-bold text-[#4c9ded] hover:underline">
            View all transactions →
          </a>
        </div>
      </div>
    </div>
  );
}
