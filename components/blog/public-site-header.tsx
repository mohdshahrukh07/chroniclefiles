import Link from "next/link";

export function PublicSiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="shrink-0 rounded-sm text-xl font-bold text-[#02a95c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
        >
          ChronicleFiles
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/blog"
            data-analytics-event="blog-navigation"
            className="min-h-11 inline-flex items-center text-sm font-medium text-slate-700 hover:text-[#02a95c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
          >
            Latest articles
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicSiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} ChronicleFiles
      </div>
    </footer>
  );
}
