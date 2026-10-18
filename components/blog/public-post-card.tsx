import Image from "next/image";
import Link from "next/link";

export interface PublicPostCardData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail?: string;
  categoryName: string;
  categorySlug?: string;
  publishedAt?: string;
}

export function PublicPostCard({ post }: { post: PublicPostCardData }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md">
      {post.thumbnail && (
        <Link
          href={`/post/${post.slug}`}
          data-analytics-event="post-card"
          tabIndex={-1}
          aria-hidden="true"
          className="block aspect-[16/9] overflow-hidden bg-slate-100"
        >
          <Image
            unoptimized
            src={post.thumbnail}
            alt={post.title}
            width={1200}
            height={675}
            className="size-full object-cover transition duration-300 hover:scale-[1.02]"
          />
        </Link>
      )}
      <div className="p-5 sm:p-6">
        {post.categorySlug ? (
          <Link
            href={`/category/${post.categorySlug}`}
            data-analytics-event="category-link"
            className="inline-flex min-h-8 items-center text-xs font-bold uppercase tracking-wider text-[#02a95c] hover:underline"
          >
            {post.categoryName}
          </Link>
        ) : (
          <span className="text-xs font-bold uppercase tracking-wider text-[#608a89]">
            {post.categoryName}
          </span>
        )}
        <h2 className="mt-2 font-serif text-2xl font-bold leading-tight text-slate-900">
          <Link
            href={`/post/${post.slug}`}
            data-analytics-event="post-card"
            className="rounded-sm hover:text-[#02a95c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
          >
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
          {post.excerpt}
        </p>
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt}
            className="mt-5 block text-xs text-slate-500"
          >
            {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
              new Date(post.publishedAt),
            )}
          </time>
        )}
      </div>
    </article>
  );
}
