"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })} // Redirect to home page after sign out
      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition"
    >
      Sign Out
    </button>
  );
}
