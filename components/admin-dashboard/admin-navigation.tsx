import Link from "next/link";
import {
  Files,
  FolderKanban,
  ChartNoAxesCombined,
  LayoutDashboard,
  PanelsTopLeft,
  Newspaper,
  Users,
} from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Posts", href: "/admin-dashboard/posts", icon: Newspaper },
  { label: "Homepage Management", href: "/admin-dashboard/homepage", icon: PanelsTopLeft },
  { label: "Categories", href: "/admin-dashboard/categories", icon: FolderKanban },
  { label: "Analytics", href: "/admin-dashboard/analytics", icon: ChartNoAxesCombined },
  { label: "Media", href: "/admin-dashboard/media", icon: Files },
  { label: "Users", href: "/admin-dashboard/users", icon: Users },
];

interface AdminNavigationProps {
  onNavigate?: () => void;
  activeHref?: string;
}

export function AdminNavigation({
  onNavigate,
  activeHref = "/admin-dashboard",
}: AdminNavigationProps) {
  return (
    <nav aria-label="Admin navigation" className="space-y-1">
      {navigationItems.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === activeHref ||
          (href === "/admin-dashboard/posts" &&
            activeHref.startsWith("/admin-dashboard/posts/")) ||
          (href === "/admin-dashboard/analytics" &&
            activeHref.startsWith("/admin-dashboard/analytics"));

        return (
          <Link
            key={label}
            href={href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] focus-visible:ring-offset-2 ${
              isActive
                ? "bg-[#e8f2f4] text-[#02a95c]"
                : "text-gray-600 hover:bg-gray-50 hover:text-[#444444]"
            }`}
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

interface AdminSidebarProps {
  username: string;
  activeHref?: string;
}

export function AdminSidebar({
  username,
  activeHref = "/admin-dashboard",
}: AdminSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
      <Brand className="h-20 border-b border-gray-100 px-6" />
      <div className="flex-1 overflow-y-auto p-4">
        <AdminNavigation activeHref={activeHref} />
      </div>
      <AdminIdentity username={username} />
    </aside>
  );
}

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex shrink-0 flex-col justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#02a95c] ${className}`}
    >
      <span className="text-xl font-bold leading-tight text-[#02a95c]">
        ChronicleFiles
      </span>
      <span className="mt-1 text-xs text-gray-400">Admin Dashboard</span>
    </Link>
  );
}

export function AdminIdentity({ username }: AdminSidebarProps) {
  return (
    <div className="border-t border-gray-100 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f2f4] font-semibold text-[#02a95c]"
        >
          {username.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#444444]">{username}</p>
          <p className="text-xs text-gray-400">Administrator</p>
        </div>
      </div>
    </div>
  );
}
