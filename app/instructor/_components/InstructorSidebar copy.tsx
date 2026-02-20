"use client";

import DashboardSidebar from "@/components/layouts/DashboardSidebar";
import {
  LayoutDashboard, School, Calendar, Users, ClipboardCheck, Clock, User,
} from "lucide-react";

const links = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "My Classes",
    href: "/classes",
    icon: School,
  },
  { label: "Schedule", href: "/schedule", icon: Calendar },
  { label: "My Students", href: "/students", icon: Users },
  {
    label: "Grading",
    href: "/grading/pending",
    icon: ClipboardCheck,
    badge: 8,
    children: [
      { label: "Pending", href: "/grading/pending" },
      { label: "History", href: "/grading/history" },
    ],
  },
  { label: "Profile", href: "/profile", icon: User },
];

export default function InstructorSidebar({ userName, userRole }: { userName?: string; userRole?: string }) {
  return (
    <DashboardSidebar
      links={links}
      portalLabel="Instructor Portal"
      portalColor="text-blue-400"
      userName={userName}
      userRole={userRole}
    />
  );
}
