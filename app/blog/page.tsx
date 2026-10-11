import type { Metadata } from "next";
import { PublicAnalyticsTracker } from "@/components/analytics/public-analytics-tracker";
import { PublicPostCard } from "@/components/blog/public-post-card";
import { PublicSiteFooter, PublicSiteHeader } from "@/components/blog/public-site-header";
import { getPublishedPosts } from "@/lib/public-posts";

export const metadata: Metadata = {
  title: "Latest Articles | ChronicleFiles",
  description: "Read the latest stories and articles from ChronicleFiles.",
};

export default async function BlogPage() {
  let posts;
  try {
    posts = await getPublishedPosts();
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Public blog could not be loaded (${errorName}).`);
    throw new Error("The latest articles could not be loaded. Please try again.");
  }

  return (
    <>
      <PublicAnalyticsTracker path="/blog" />
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-9 border-b border-slate-200 pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#02a95c]">
            ChronicleFiles
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-slate-900 sm:text-5xl">
            Latest Articles
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Reporting, ideas, and stories across the topics that matter.
          </p>
        </header>

        {posts.length ? (
          <section
            aria-label="Published articles"
            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {posts.map((post) => <PublicPostCard key={post.id} post={post} />)}
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              No published articles yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Please check back soon for the latest stories.
            </p>
          </section>
        )}
      </main>
      <PublicSiteFooter />
    </>
  );
}
