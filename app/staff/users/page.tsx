import { getAuthSession } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma/client";
import PeopleTabs from "../_components/PeopleTabs";

export const metadata = { title: "People | Staff Portal" };

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const [total, applicantAll, applicantPendingPayment, applicantPendingApproval, studentAll, studentActive, studentSuspended, studentArchived] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "APPLICANT", status: "PENDING" } }),
    prisma.user.count({ where: { role: "APPLICANT", status: "PENDING", registrationPaid: false } }),
    prisma.user.count({ where: { role: "APPLICANT", status: "PENDING", registrationPaid: true } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "STUDENT", status: "SUSPENDED" } }),
    prisma.user.count({ where: { role: "STUDENT", status: "ARCHIVED" } }),
  ]);

  return (
    <PeopleTabs
      initialTab={searchParams.tab}
      initialTotal={total}
      applicantCounts={{ all: applicantAll, pending_payment: applicantPendingPayment, pending_approval: applicantPendingApproval }}
      studentCounts={{ all: studentAll, active: studentActive, suspended: studentSuspended, archived: studentArchived }}
    />
  );
}
