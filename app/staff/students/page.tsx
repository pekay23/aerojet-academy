import { getAuthSession } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma/client";
import StudentsTable from "../_components/StudentsTable";

export const metadata = { title: "Students | Staff Portal" };

async function getCounts() {
  const [all, active, suspended, archived] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "STUDENT", status: "SUSPENDED" } }),
    prisma.user.count({ where: { role: "STUDENT", status: "ARCHIVED" } }),
  ]);
  return { all, active, suspended, archived };
}

export default async function StudentsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const counts = await getCounts();
  return <StudentsTable initialCounts={counts} />;
}