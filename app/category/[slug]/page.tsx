import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicAnalyticsTracker } from "@/components/analytics/public-analytics-tracker";
import { PublicPostCard } from "@/components/blog/public-post-card";
import { PublicSiteFooter, PublicSiteHeader } from "@/components/blog/public-site-header";
import { getPublishedCategory, getPublishedPosts } from "@/lib/public-posts";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await getPublishedCategory(slug);
    if (!category) return { title: "Category not found | ChronicleFiles" };
    return {
      title: `${category.name} | ChronicleFiles`,
      description: category.description || `Latest articles in ${category.name}.`,
    };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Category metadata could not be loaded (${errorName}).`);
    return { title: "Category | ChronicleFiles" };
  }
}

export default async function PublicCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  let category;
  let posts;
  try {
    category = await getPublishedCategory(slug);
    posts = category ? await getPublishedPosts(category._id.toString()) : [];
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Public category could not be loaded (${errorName}).`);
    throw new Error("This category could not be loaded. Please try again.");
  }
  if (!category) notFound();

  return (
    <>
      <PublicAnalyticsTracker path={`/category/${slug}`} />
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-9 border-b border-slate-200 pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#02a95c]">
            Category
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-slate-900 sm:text-5xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              {category.description}
            </p>
          )}
        </header>
        {posts.length ? (
          <section
            aria-label={`${category.name} articles`}
            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {posts.map((post) => <PublicPostCard key={post.id} post={post} />)}
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              No published articles in this category yet
            </h2>
          </section>
        )}
      </main>
      <PublicSiteFooter />
    </>
  );
}
