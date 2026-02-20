import { getAuthSession } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma/client";
import UsersTable from "../_components/UsersTable";

export const metadata = { title: "Users | Staff Portal" };

export default async function UsersPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const total = await prisma.user.count();
  return <UsersTable initialTotal={total} />;
}