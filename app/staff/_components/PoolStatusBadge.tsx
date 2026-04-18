import { type PoolStatus } from "@prisma/client";

const config: Record<PoolStatus, { label: string; classes: string }> = {
  DRAFT:      { label: "Draft",      classes: "bg-slate-100 text-slate-500" },
  OPEN:       { label: "Open",       classes: "bg-blue-100 text-blue-700" },
  NEAR_FULL:  { label: "Near Full",  classes: "bg-amber-100 text-amber-700" },
  CONFIRMED:  { label: "Confirmed",  classes: "bg-green-100 text-green-700" },
  LOCKED:     { label: "Locked",     classes: "bg-purple-100 text-purple-700" },
  FAILED:     { label: "Failed",     classes: "bg-red-100 text-red-600" },
  MERGED:          { label: "Merged",          classes: "bg-orange-100 text-orange-700" },
  COMPLETED:       { label: "Completed",       classes: "bg-teal-100 text-teal-700" },
  REDISTRIBUTING:  { label: "Redistributing",  classes: "bg-indigo-100 text-indigo-700" },
};

interface PoolStatusBadgeProps {
  status: PoolStatus;
  size?: "sm" | "md";
}

export default function PoolStatusBadge({ status, size = "md" }: PoolStatusBadgeProps) {
  const { label, classes } = config[status] ?? { label: status, classes: "bg-slate-100 text-slate-500" };

  return (
    <span
      className={`inline-flex shrink-0 items-center font-bold rounded-full ${classes} ${
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      }`}
    >
      {label}
    </span>
  );
}
