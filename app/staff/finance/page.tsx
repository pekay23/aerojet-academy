import { getAuthSession } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma/client";
import FinanceOverview from "../_components/FinanceOverview";

export const metadata = { title: "Finance | Staff Portal" };

async function getChartData() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const payments = await prisma.payment.findMany({
    where: { status: "APPROVED", approvedAt: { gte: sixMonthsAgo } },
    select: { amount: true, approvedAt: true },
  });

  const map: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    map[`${monthNames[d.getMonth()]} ${d.getFullYear()}`] = 0;
  }
  for (const p of payments) {
    if (!p.approvedAt) continue;
    const d = new Date(p.approvedAt);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (key in map) map[key] += Number(p.amount);
  }
  return Object.entries(map).map(([k, revenue]) => ({ month: k.split(" ")[0], revenue }));
}

export default async function FinancePage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const chartData = await getChartData();
  return <FinanceOverview chartData={chartData} />;
}