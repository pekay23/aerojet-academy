import { getAuthSession } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma/client";
import PaymentsQueue from "../_components/PaymentsQueue";

export const metadata = { title: "Payments | Staff Portal" };

export default async function PaymentsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const pendingCount = await prisma.payment.count({ where: { status: "PENDING" } });
  return <PaymentsQueue initialPendingCount={pendingCount} />;
}