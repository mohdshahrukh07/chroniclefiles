import Image from "next/image";
import Link from "next/link";
import { PublicAnalyticsTracker } from "@/components/analytics/public-analytics-tracker";
import { AdSlot } from "@/components/blog/ad-slot";
import { HomepageCarousel } from "@/components/blog/homepage-carousel";
import {
  PublicSiteFooter,
  PublicSiteHeader,
} from "@/components/blog/public-site-header";
import type { PublicPostCardData } from "@/components/blog/public-post-card";
import type { PublicHomepageData } from "@/types/homepage";
import { arePublicAdsConfigured } from "@/lib/public-site-config";

function HomepageStoryCard({
  post,
  size = "small",
  priority = false,
}: {
  post: PublicPostCardData;
  size?: "small" | "large";
  priority?: boolean;
}) {
  const isLarge = size === "large";
  return (
    <Link
      href={`/post/${post.slug}`}
      data-analytics-event="post-card"
      aria-label={`Read ${post.title}`}
      className={`group relative block overflow-hidden rounded-[5px] bg-[#608A89] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#02A95C] ${
        isLarge
          ? "aspect-square max-[1199px]:h-full max-[1199px]:aspect-auto"
          : "aspect-square"
      }`}
    >
      {post.thumbnail && (
        <Image
          unoptimized
          fill
          priority={priority}
          src={post.thumbnail}
          alt=""
          sizes={
            isLarge
              ? "(min-width: 1200px) 42vw, (min-width: 900px) 55vw, 65vw"
              : "(min-width: 1200px) 25vw, (min-width: 900px) 40vw, 50vw"
          }
          className="object-cover transition duration-500 group-hover:scale-[1.045]"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/[.02] via-black/[.14] to-black/[.82]"
      />
      <span
        className={`absolute inset-x-0 bottom-0 z-10 text-left ${
          isLarge
            ? "p-[13px] min-[900px]:p-[18px] min-[1200px]:p-[26px]"
            : "p-[10px] min-[560px]:p-[14px]"
        }`}
      >
        <span className="mb-2 inline-block rounded-[2px] bg-[#02A95C] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.08em] text-white min-[560px]:text-[10px]">
          {isLarge ? "Editor's Pick" : post.categoryName}
        </span>
        {isLarge ? (
          <>
            <span className="line-clamp-3 block text-[clamp(21px,2.8vw,43px)] font-black leading-[1.08] tracking-[-.035em]">
              {post.title}
            </span>
            {post.excerpt && (
              <span className="mt-2 line-clamp-2 max-w-lg text-xs leading-5 text-white/85 sm:mt-3 sm:line-clamp-3 sm:text-sm">
                {post.excerpt}
              </span>
            )}
            <span className="mt-3 block text-[10px] font-semibold text-white/80">
              {post.categoryName}
            </span>
          </>
        ) : (
          <span className="block text-[13px] font-extrabold leading-[1.18] min-[560px]:text-[clamp(15px,1.25vw,20px)]">
            {post.title}
          </span>
        )}
      </span>
    </Link>
  );
}

function HomepageSidebar({
  data,
  adsConfigured,
}: {
  data: PublicHomepageData;
  adsConfigured: boolean;
}) {
  return (
    <aside
      aria-label="Recommendations and categories"
      className="min-w-0 space-y-7 lg:sticky lg:top-24"
    >
      {adsConfigured && <AdSlot format="square" placement="homepage-sidebar-top" />}

      <section aria-labelledby="homepage-recommendations-heading">
        <div className="mb-5 flex items-center justify-between border-b-2 border-[#02A95C] pb-3">
          <h2
            id="homepage-recommendations-heading"
            className="text-xl font-black tracking-tight text-[#292929]"
          >
            Recommended
          </h2>
          <span aria-hidden="true" className="text-[#02A95C]">
            ✳
          </span>
        </div>
        {data.recommendations.length ? (
          <ul className="space-y-5">
            {data.recommendations.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/post/${post.slug}`}
                  data-analytics-event="post-card"
                  className="group grid grid-cols-[92px_minmax(0,1fr)] items-start gap-[13px] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
                >
                  <span className="relative h-[76px] overflow-hidden rounded-[4px] bg-[#E8F2F4]">
                    {post.thumbnail && (
                      <Image
                        unoptimized
                        fill
                        src={post.thumbnail}
                        alt=""
                        sizes="92px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold leading-[1.35] text-[#303030] group-hover:text-[#02A95C]">
                      {post.title}
                    </span>
                    <span className="mt-1.5 block text-[11px] text-[#7a8580]">
                      {post.categoryName}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-[#66716c]">
            There are no other published stories to recommend yet.
          </p>
        )}
      </section>

      {adsConfigured && <AdSlot format="square" placement="homepage-sidebar-bottom" />}

      <section aria-labelledby="homepage-categories-heading">
        <div className="mb-4 border-b-2 border-[#02A95C] pb-3">
          <h2
            id="homepage-categories-heading"
            className="text-xl font-black tracking-tight text-[#292929]"
          >
            Explore Categories
          </h2>
        </div>
        {data.categories.length ? (
          <ul className="flex flex-wrap gap-2">
            {data.categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  data-analytics-event="category-link"
                  className="inline-flex min-h-10 items-center rounded-[3px] bg-[#E8F2F4] px-[13px] text-xs font-bold text-[#3c6661] transition hover:bg-[#02A95C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-[#66716c]">
            Categories will appear here when they are available.
          </p>
        )}
      </section>
    </aside>
  );
}

function HomepageExploreStrip({
  categories,
}: {
  categories: PublicHomepageData["categories"];
}) {
  const featuredCategories = categories.filter((category) =>
    ["technology", "education", "entertainment"].includes(
      category.slug.toLowerCase(),
    ),
  );

  return (
    <section className="mt-14 border-y border-gray-200 py-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#02A95C]">
            Explore more
          </p>
          <h2 className="mt-1 text-xl font-black text-[#292929]">
            Follow your curiosity.
          </h2>
        </div>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href="/blog"
              data-analytics-event="blog-navigation"
              className="inline-flex min-h-10 items-center rounded-[3px] bg-[#E8F2F4] px-[13px] text-xs font-bold text-[#3c6661] hover:bg-[#02A95C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
            >
              Latest Stories
            </Link>
          </li>
          {featuredCategories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/category/${category.slug}`}
                data-analytics-event="category-link"
                className="inline-flex min-h-10 items-center rounded-[3px] bg-[#E8F2F4] px-[13px] text-xs font-bold text-[#3c6661] hover:bg-[#02A95C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HomepagePage({ data }: { data: PublicHomepageData }) {
  const adsConfigured = arePublicAdsConfigured();
  const categoryBySlug = new Map(
    data.categories.map((category) => [category.slug.toLowerCase(), category]),
  );
  const editorsPick = data.featured.editorsPickPostId;
  const showRightColumn = Boolean(
    data.featured.rightTopPostId ||
      adsConfigured ||
      data.featured.rightBottomPostId,
  );

  return (
    <>
      <PublicAnalyticsTracker path="/" />
      <PublicSiteHeader categories={data.categories} />
      <main className="mx-auto w-full max-w-[1488px] px-6 max-[900px]:w-[calc(100%-32px)] max-[900px]:max-w-[720px] max-[900px]:px-0 max-[560px]:w-[calc(100%-28px)]">
        <section className="flex flex-wrap items-end justify-between gap-3 pb-5 pt-7">
          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#02A95C]">
              Stories · Ideas · Knowledge
            </p>
            <h1 className="text-2xl font-black tracking-[-1px] text-[#252525] sm:text-3xl">
              Discover something new.
            </h1>
          </div>
          <p className="text-xs text-gray-500">
            Ideas that keep you curious.
          </p>
        </section>

        <section
          aria-label="Featured stories"
          className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] items-start gap-[10px] min-[560px]:gap-[14px] max-[1199px]:items-stretch min-[901px]:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)_minmax(0,1fr)] min-[1200px]:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,.98fr)] min-[1200px]:gap-[18px]"
        >
          <div className="grid min-w-0 gap-[10px] min-[560px]:gap-[14px] min-[1200px]:gap-[18px]">
            {data.featured.leftTopPostId && (
              <HomepageStoryCard
                post={data.featured.leftTopPostId}
                priority
              />
            )}
            {data.featured.leftBottomPostId && (
              <HomepageStoryCard post={data.featured.leftBottomPostId} />
            )}
          </div>

          {editorsPick && (
            <div className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)]">
              <HomepageStoryCard post={editorsPick} size="large" priority />
            </div>
          )}

          {showRightColumn && (
            <div className="col-span-2 grid min-w-0 grid-cols-2 items-start gap-[10px] min-[560px]:gap-[14px] min-[901px]:col-span-1 min-[901px]:grid-cols-1">
              {data.featured.rightTopPostId && (
                <div className="min-w-0">
                  <HomepageStoryCard post={data.featured.rightTopPostId} />
                </div>
              )}
              {adsConfigured ? (
                <AdSlot format="square" placement="homepage-right-featured" />
              ) : (
                data.featured.rightBottomPostId && (
                  <div className="min-w-0">
                    <HomepageStoryCard
                      post={data.featured.rightBottomPostId}
                    />
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {adsConfigured && (
          <section className="mt-8" aria-label="Advertisement">
            <AdSlot format="inline" placement="homepage-banner-one" />
          </section>
        )}

        <section id="latest" className="mt-12">
          <HomepageCarousel
            id="homepage-latest"
            eyebrow="Stay informed"
            title="Latest Stories"
            posts={data.latest}
            cardCount={6}
            viewAllHref="/blog"
            viewAllLabel="View all stories"
          />
        </section>

        {adsConfigured && (
          <section className="mt-10" aria-label="Advertisement">
            <AdSlot format="inline" placement="homepage-banner-two" />
          </section>
        )}

        <section id="technology" className="mt-12">
          <HomepageCarousel
            id="homepage-technology"
            eyebrow="Innovation & discovery"
            title="Technology"
            posts={data.technology}
            cardCount={5}
            viewAllHref={
              categoryBySlug.get("technology")
                ? `/category/${categoryBySlug.get("technology")!.slug}`
                : undefined
            }
            viewAllLabel="Explore technology"
          />
        </section>

        <div className="mt-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-10">
            <section id="education">
              <HomepageCarousel
                id="homepage-education"
                eyebrow="Learn every day"
                title="Education & Learning"
                posts={data.education}
                cardCount={4}
              />
            </section>

            {adsConfigured && (
              <section aria-label="Advertisement">
                <AdSlot format="inline" placement="homepage-banner-three" />
              </section>
            )}

            <section id="entertainment">
              <HomepageCarousel
                id="homepage-entertainment"
                eyebrow="Culture & creativity"
                title="Entertainment"
                posts={data.entertainment}
                cardCount={4}
              />
            </section>
          </div>

          <HomepageSidebar data={data} adsConfigured={adsConfigured} />
        </div>

        <HomepageExploreStrip categories={data.categories} />
      </main>
      <PublicSiteFooter categories={data.categories} />
    </>
  );
}
