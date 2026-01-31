import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// We will build a specific StaffSidebar later
import Link from "next/link"; 

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // 1. Check if logged in
  if (!session || !session.user) {
    redirect('/portal/login');
  }

  // 2. CHECK ROLE: Only ADMIN or STAFF allowed
  if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
    // Redirect unauthorized students back to their own portal
    redirect('/portal/dashboard');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Temporary Sidebar for Staff */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h2 className="text-xl font-bold mb-6 text-white">Staff Portal</h2>
        <nav className="space-y-2">
          <Link href="/staff/dashboard" className="block py-2 hover:text-blue-300">Dashboard</Link>
          <Link href="/staff/applications" className="block py-2 hover:text-blue-300">Applications</Link>
          <Link href="/staff/finance" className="block py-2 hover:text-blue-300">Finance & Verify</Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
