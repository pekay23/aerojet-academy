"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

function segmentToLabel(segment: string): string {
  return segment
    .replace(/\[.*?\]/g, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Remove route group prefixes like (staff), (student) etc.
  const cleanSegments = segments.filter((s) => !s.startsWith("(") && !s.endsWith(")"));

  if (cleanSegments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 overflow-x-auto">
      <Link href="/" className="hover:text-slate-600 transition-colors shrink-0">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {cleanSegments.map((segment, i) => {
        const href = "/" + cleanSegments.slice(0, i + 1).join("/");
        const isLast = i === cleanSegments.length - 1;
        const label = segmentToLabel(segment);

        return (
          <span key={href} className="flex items-center gap-1.5 shrink-0">
            <ChevronRight className="w-3 h-3 text-slate-300" />
            {isLast ? (
              <span className="font-semibold text-slate-700 truncate max-w-[200px]">{label}</span>
            ) : (
              <Link href={href} className="hover:text-slate-600 transition-colors truncate max-w-[150px]">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
