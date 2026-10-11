import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileAdminNavigation } from "@/components/admin-dashboard/mobile-admin-navigation";
import type { logoutAction } from "@/app/admin-dashboard/actions";

interface AdminHeaderProps {
  username: string;
  logoutAction: typeof logoutAction;
  title?: string;
  description?: string;
}

export function AdminHeader({
  username,
  logoutAction: signOut,
  title = "Dashboard",
  description = "Manage your ChronicleFiles content.",
}: AdminHeaderProps) {
  return (
    <header className="relative z-10 border-b border-gray-200 bg-white">
      <div className="flex min-h-20 flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <MobileAdminNavigation username={username} />
        <div className="hidden min-w-0 flex-1 items-center justify-between gap-6 lg:flex">
          <div>
            <h1 className="text-2xl font-bold text-[#444444]">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <form action={signOut}>
              <Button type="submit" variant="outline" className="h-11 px-4">
                Sign out
              </Button>
            </form>
            <Link
              href="/admin-dashboard/posts/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#02a95c] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#029650] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] focus-visible:ring-offset-2"
            >
              <Plus aria-hidden="true" className="size-4" />
              Create Post
            </Link>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-3 lg:hidden">
          <div>
            <h1 className="text-xl font-bold text-[#444444] sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <form action={signOut}>
              <Button type="submit" variant="outline" className="h-11 px-3 sm:px-4">
                Sign out
              </Button>
            </form>
            <Link
              href="/admin-dashboard/posts/new"
              aria-label="Create Post"
              className="inline-flex size-11 items-center justify-center rounded-lg bg-[#02a95c] text-white transition-colors hover:bg-[#029650] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] focus-visible:ring-offset-2 sm:w-auto sm:gap-2 sm:px-4"
            >
              <Plus aria-hidden="true" className="size-4" />
              <span className="sr-only sm:not-sr-only">Create Post</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
