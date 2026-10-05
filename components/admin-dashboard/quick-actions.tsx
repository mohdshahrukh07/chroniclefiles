import Link from "next/link";
import {
  FilePlus2,
  Files,
  FolderKanban,
  Users,
  type LucideIcon,
} from "lucide-react";

const actions: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconColor: string;
}[] = [
  {
    title: "Create Post",
    description: "Write and publish a new article.",
    href: "/admin-dashboard/posts/new",
    icon: FilePlus2,
    iconColor: "text-[#02a95c]",
  },
  {
    title: "Manage Categories",
    description: "Create and organize categories.",
    href: "/admin-dashboard/categories",
    icon: FolderKanban,
    iconColor: "text-[#608a89]",
  },
  {
    title: "Media Library",
    description: "Manage uploaded media files.",
    href: "/admin-dashboard/media",
    icon: Files,
    iconColor: "text-[#608a89]",
  },
  {
    title: "Manage Users",
    description: "Manage administrator and editor accounts.",
    href: "/admin-dashboard/users",
    icon: Users,
    iconColor: "text-[#608a89]",
  },
];

export function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-title">
      <div className="mb-4">
        <h2 id="quick-actions-title" className="text-lg font-bold text-[#444444]">
          Quick Actions
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Common content management actions
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map(({ title, description, href, icon: Icon, iconColor }) => (
          <Link
            key={title}
            href={href}
            className="group min-h-40 rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-[#02a95c] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] focus-visible:ring-offset-2"
          >
            <span
              aria-hidden="true"
              className={`mb-4 flex size-10 items-center justify-center rounded-lg bg-[#e8f2f4] ${iconColor}`}
            >
              <Icon className="size-5" />
            </span>
            <span className="block font-semibold text-[#444444] group-hover:text-[#02a95c]">
              {title}
            </span>
            <span className="mt-1 block text-sm leading-5 text-gray-500">
              {description}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
