import { getAuthSession } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma/client";
import ApplicantsQueue from "../_components/ApplicantsQueue";

export const metadata = { title: "Applicant Queue | Staff Portal" };

async function getCounts() {
  const [all, pendingPayment, pendingApproval] = await Promise.all([
    prisma.user.count({ where: { role: "APPLICANT", status: "PENDING" } }),
    prisma.user.count({ where: { role: "APPLICANT", status: "PENDING", registrationPaid: false } }),
    prisma.user.count({ where: { role: "APPLICANT", status: "PENDING", registrationPaid: true } }),
  ]);
  return { all, pending_payment: pendingPayment, pending_approval: pendingApproval };
}

export default async function ApplicantsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const counts = await getCounts();

  return <ApplicantsQueue initialCounts={counts} />;
}