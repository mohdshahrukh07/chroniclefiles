import Image from "next/image";
import Link from "next/link";
import type { PublicPostCardData } from "@/components/blog/public-post-card";

function getValidPublishedDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function CategoryPostCard({
  post,
  eager = false,
}: {
  post: PublicPostCardData;
  eager?: boolean;
}) {
  const publishedDate = getValidPublishedDate(post.publishedAt);

  return (
    <article className="group overflow-hidden rounded-[5px] border border-[#e8ece9] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(20,50,35,.09)]">
      <Link
        href={`/post/${post.slug}`}
        data-analytics-event="post-card"
        aria-label={`Read ${post.title}`}
        className="relative block aspect-[5/4] overflow-hidden bg-[linear-gradient(135deg,#608A89,#123f33)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#02A95C]"
      >
        {post.thumbnail && (
          <Image
            unoptimized
            fill
            src={post.thumbnail}
            alt={post.title}
            sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 100vw"
            loading={eager ? "eager" : "lazy"}
            className="object-cover transition duration-500 group-hover:scale-[1.045]"
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-b from-transparent via-[rgba(10,20,15,.22)] to-[rgba(10,20,15,.76)] p-4 sm:p-[18px]">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-[2px] bg-[#E8F2F4] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.07em] text-[#367064]">
              {post.categoryName}
            </span>
            {publishedDate && (
              <time
                dateTime={publishedDate.toISOString()}
                className="text-[10px] text-white/85"
              >
                {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                }).format(publishedDate)}
              </time>
            )}
          </div>

          <h2 className="font-sans text-base font-extrabold leading-[1.3] tracking-[-.025em] text-white transition-colors group-hover:text-[#b8f3d0] sm:text-lg">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-3 line-clamp-3 text-xs leading-[1.7] text-white/85">
              {post.excerpt}
            </p>
          )}
          <span className="mt-4 flex items-center justify-between border-t border-white/35 pt-3 text-[10px] font-semibold text-white/85">
            <span>{post.categoryName}</span>
            <span className="text-xs font-extrabold text-white">
              Read Article <span aria-hidden="true">↗</span>
            </span>
          </span>
        </div>
      </Link>
    </article>
  );
}
