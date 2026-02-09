"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes"; // Import this
import { CommandMenu } from "@/app/components/marketing/CommandMenu";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <CommandMenu />
      </ThemeProvider>
    </SessionProvider>
  );
}

