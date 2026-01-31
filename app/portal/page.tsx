import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function PortalRouter() {
  const session = await getServerSession(authOptions);

  // 1. Not logged in? Go to login.
  if (!session || !session.user) {
    redirect('/portal/login');
  }

  // 2. Is Admin or Staff? Go to Staff Portal.
  if (session.user.role === 'ADMIN' || session.user.role === 'STAFF') {
    redirect('/staff/dashboard');
  }

  // 3. Everyone else (Students)? Go to Student Portal.
  redirect('/portal/dashboard');
}
