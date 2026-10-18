import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicAnalyticsTracker } from "@/components/analytics/public-analytics-tracker";
import { AdSlot } from "@/components/blog/ad-slot";
import { ArticleShareActions } from "@/components/blog/article-share-actions";
import { ArticleSidebar } from "@/components/blog/article-sidebar";
import { PublicPostContent } from "@/components/blog/public-post-content";
import { PublicSiteFooter, PublicSiteHeader } from "@/components/blog/public-site-header";
import { RelatedArticles } from "@/components/blog/related-articles";
import {
  getPublishedArticleSidebarData,
  getPublishedPostBySlug,
} from "@/lib/public-posts";
import { getPublicSiteUrl } from "@/lib/public-site-config";

interface PublicPostPageProps {
  params: Promise<{ slug: string }>;
}

function safeWebUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function getCanonicalUrl(slug: string, siteUrl: URL | null): string | undefined {
  if (!siteUrl) return undefined;
  return new URL(`/post/${encodeURIComponent(slug)}`, siteUrl).toString();
}

export async function generateMetadata({
  params,
}: PublicPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPublishedPostBySlug(slug);
    if (!post) {
      return { title: "Article not found | ChronicleFiles" };
    }

    const siteUrl = getPublicSiteUrl();
    const canonicalUrl = getCanonicalUrl(slug, siteUrl);
    const title = post.metaTitle || post.title;
    const description =
      post.metaDescription ||
      post.excerpt ||
      `Read ${post.title} on ChronicleFiles.`;
    const image = safeWebUrl(post.thumbnail);

    return {
      title,
      description,
      ...(siteUrl ? { metadataBase: siteUrl } : {}),
      ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
      openGraph: {
        type: "article",
        siteName: "ChronicleFiles",
        title,
        description,
        ...(canonicalUrl ? { url: canonicalUrl } : {}),
        ...(image ? { images: [{ url: image }] } : {}),
        ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Article metadata could not be loaded (${errorName}).`);
    return { title: "Article | ChronicleFiles" };
  }
}

export default async function PublicPostPage({
  params,
}: PublicPostPageProps) {
  const { slug } = await params;
  let post;
  let sidebarData;
  try {
    post = await getPublishedPostBySlug(slug);
    if (post) {
      sidebarData = await getPublishedArticleSidebarData(
        post.slug,
        post.categoryId,
      );
    }
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Public article could not be loaded (${errorName}).`);
    throw new Error("This article could not be loaded. Please try again.");
  }
  if (!post || !sidebarData) notFound();

  const siteUrl = getPublicSiteUrl();
  const canonicalUrl = getCanonicalUrl(post.slug, siteUrl);
  const thumbnail = safeWebUrl(post.thumbnail);
  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : null;
  const hasValidPublishedDate =
    publishedDate !== null && !Number.isNaN(publishedDate.getTime());
  const jsonLd =
    canonicalUrl && hasValidPublishedDate
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          ...(post.excerpt ? { description: post.excerpt } : {}),
          datePublished: publishedDate.toISOString(),
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": canonicalUrl,
          },
          ...(thumbnail ? { image: [thumbnail] } : {}),
        }
      : null;

  return (
    <>
      <PublicAnalyticsTracker path={`/post/${slug}`} />
      <PublicSiteHeader categories={sidebarData.categories} />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-6">
        <div className="grid min-w-0 grid-cols-1 items-start gap-8 min-[768px]:grid-cols-[minmax(0,1fr)_260px] min-[768px]:gap-[26px] min-[901px]:grid-cols-[minmax(0,1fr)_300px] min-[901px]:gap-[42px]">
          <article className="min-w-0">
            <header>
              {post.categorySlug ? (
                <Link
                  href={`/category/${post.categorySlug}`}
                  data-analytics-event="article-category"
                  className="inline-flex min-h-9 items-center rounded-sm text-[13px] font-bold uppercase tracking-[.7px] text-[#02A95C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
                >
                  {post.categoryName}
                </Link>
              ) : (
                <span className="inline-flex min-h-9 items-center text-[13px] font-bold uppercase tracking-[.7px] text-[#608A89]">
                  {post.categoryName}
                </span>
              )}
              <h1 className="mt-1 font-sans text-[clamp(30px,4vw,46px)] font-extrabold leading-[1.16] tracking-[-1.3px] text-[#252d29] max-[720px]:text-[34px] max-[380px]:text-[30px]">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mb-[18px] mt-3 text-base leading-[1.7] text-[#66716c] sm:text-lg">
                  {post.excerpt}
                </p>
              )}
              <div className="mb-[22px] mt-4 flex flex-wrap items-center gap-2 text-[13px] text-[#727c77]">
                <span>{post.categoryName}</span>
                <span aria-hidden="true">•</span>
                <span className="font-semibold text-[#525d57]">Published</span>
                {hasValidPublishedDate && (
                  <>
                    <span aria-hidden="true">•</span>
                    <time
                      dateTime={publishedDate.toISOString()}
                      title={`Published on ${publishedDate.toLocaleString("en")}`}
                    >
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "long",
                      }).format(publishedDate)}
                    </time>
                  </>
                )}
              </div>
              {thumbnail && (
                <div className="relative my-6 aspect-video w-full overflow-hidden rounded-xl bg-[#E8F2F4]">
                  <Image
                    unoptimized
                    fill
                    src={thumbnail}
                    alt={post.title}
                    sizes="(min-width: 1280px) 858px, (min-width: 901px) calc(100vw - 430px), (min-width: 768px) calc(100vw - 360px), 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
              )}
            </header>

            {thumbnail && (
              <AdSlot format="inline" placement="article-after-hero" />
            )}
            {post.content.length ? (
              <PublicPostContent blocks={post.content} />
            ) : (
              <p className="mt-7 text-base leading-7 text-[#66716c]">
                Article content is not available yet.
              </p>
            )}

            <ArticleShareActions title={post.title} />
            <RelatedArticles
              posts={sidebarData.recommendations}
              categoryName={post.categoryName}
            />
          </article>
          <ArticleSidebar
            recommendations={sidebarData.recommendations}
            categories={sidebarData.categories}
          />
        </div>
      </main>
      <PublicSiteFooter categories={sidebarData.categories} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </>
  );
}
