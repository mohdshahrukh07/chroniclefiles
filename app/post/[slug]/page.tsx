import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicAnalyticsTracker } from "@/components/analytics/public-analytics-tracker";
import { PublicPostContent } from "@/components/blog/public-post-content";
import { PublicSiteFooter, PublicSiteHeader } from "@/components/blog/public-site-header";
import { getPublishedPostBySlug } from "@/lib/public-posts";

interface PublicPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PublicPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPublishedPostBySlug(slug);
    if (!post) return { title: "Article not found | ChronicleFiles" };
    return {
      title: post.title,
      description: post.excerpt,
      openGraph: {
        type: "article",
        title: post.title,
        description: post.excerpt,
        ...(post.thumbnail ? { images: [post.thumbnail] } : {}),
        ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      },
    };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Article metadata could not be loaded (${errorName}).`);
    return { title: "Article | ChronicleFiles" };
  }
}

export default async function PublicPostPage({ params }: PublicPostPageProps) {
  const { slug } = await params;
  let post;
  try {
    post = await getPublishedPostBySlug(slug);
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Public article could not be loaded (${errorName}).`);
    throw new Error("This article could not be loaded. Please try again.");
  }
  if (!post) notFound();

  return (
    <>
      <PublicAnalyticsTracker path={`/post/${slug}`} />
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-10 sm:py-12">
          <div className="mx-auto max-w-3xl">
            {post.categorySlug ? (
              <Link
                href={`/category/${post.categorySlug}`}
                data-analytics-event="article-category"
                className="inline-flex min-h-9 items-center text-xs font-bold uppercase tracking-[0.18em] text-[#02a95c] hover:underline"
              >
                {post.categoryName}
              </Link>
            ) : (
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#608a89]">
                {post.categoryName}
              </span>
            )}
            <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {post.excerpt}
              </p>
            )}
            {post.publishedAt && (
              <time
                dateTime={post.publishedAt}
                className="mt-5 block text-sm text-slate-500"
              >
                {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(
                  new Date(post.publishedAt),
                )}
              </time>
            )}
          </div>
          {post.thumbnail && (
            <div className="relative mx-auto my-8 aspect-video w-full max-w-4xl overflow-hidden rounded-xl bg-slate-100 sm:my-10">
              <Image
                unoptimized
                fill
                src={post.thumbnail}
                alt=""
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="mx-auto max-w-[68ch] border-t border-slate-200 pt-2">
            <PublicPostContent blocks={post.content} />
          </div>
        </article>
      </main>
      <PublicSiteFooter />
    </>
  );
}
