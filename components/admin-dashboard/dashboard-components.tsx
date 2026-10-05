import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  Clock3,
  FileText,
  FolderKanban,
} from "lucide-react";

interface DashboardSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className = "",
  contentClassName = "",
}: DashboardSectionProps) {
  return (
    <section
      aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-title`}
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
        <div className="min-w-0">
          <h2
            id={`${title.toLowerCase().replaceAll(" ", "-")}-title`}
            className="text-lg font-bold text-[#444444]"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  iconClassName?: string;
}

export function KpiCard({
  title,
  value,
  caption,
  icon: Icon,
  iconClassName = "bg-[#e8f2f4] text-[#02a95c]",
}: KpiCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#444444]">
            {value}
          </p>
        </div>
        <div
          aria-hidden="true"
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-4 text-xs text-gray-400">{caption}</p>
    </article>
  );
}

export const dashboardMetrics: KpiCardProps[] = [
  {
    title: "Total Posts",
    value: "128",
    caption: "All articles",
    icon: FileText,
  },
  {
    title: "Published",
    value: "96",
    caption: "Live articles",
    icon: Check,
    iconClassName: "bg-green-50 text-[#02a95c]",
  },
  {
    title: "Drafts",
    value: "32",
    caption: "Unpublished articles",
    icon: Clock3,
    iconClassName: "bg-yellow-50 text-yellow-600",
  },
  {
    title: "Categories",
    value: "15",
    caption: "Content categories",
    icon: FolderKanban,
    iconClassName: "bg-[#e8f2f4] text-[#608a89]",
  },
];
