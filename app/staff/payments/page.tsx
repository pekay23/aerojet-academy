import { getAuthSession } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma/client";
import PaymentsQueue from "../_components/PaymentsQueue";

export const metadata = { title: "Payments | Staff Portal" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const pendingCount = await prisma.payment.count({ where: { status: "PENDING" } });
  const initialTab = ['PENDING', 'APPROVED', 'REJECTED'].includes(searchParams.tab?.toUpperCase() ?? '')
    ? searchParams.tab!.toUpperCase()
    : 'PENDING'
  return <PaymentsQueue initialPendingCount={pendingCount} initialTab={initialTab} />;
}