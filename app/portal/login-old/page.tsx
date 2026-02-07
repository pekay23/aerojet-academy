import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LoginForm from "@/components/portal/LoginForm"; // We will move the form to a client component

export default async function StudentLoginPage() {
  const session = await getServerSession(authOptions);

  // If the user is already logged in, redirect them to the dashboard
  if (session) {
    redirect('/portal/dashboard');
  }

  // If not logged in, render the login form component
  return (
    <LoginForm />
  );
}
