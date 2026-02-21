"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Calendar, 
  BookOpen, 
  Settings, 
  UserCircle,
  LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  if (!session) return null; // Don't render for public visitors

  const isAdminOrStaff = role === 'ADMIN' || role === 'STAFF';

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <button 
          onClick={() => setOpen(true)}
          className="bg-slate-900 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center font-bold"
        >
          K
        </button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="General">
            <CommandItem onSelect={() => runCommand(() => router.push(isAdminOrStaff ? '/staff/dashboard' : '/portal/dashboard'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push(isAdminOrStaff ? '/staff/profile' : '/portal/profile'))}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </CommandItem>
          </CommandGroup>

          {isAdminOrStaff && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Admin Controls">
                <CommandItem onSelect={() => runCommand(() => router.push('/staff/users'))}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Manage Users</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/staff/finance'))}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Verify Payments</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/staff/courses'))}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Manage Courses</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/staff/exams'))}>
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Exam Scheduler</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="System">
            <CommandItem onSelect={() => runCommand(() => signOut({ callbackUrl: '/' }))}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
