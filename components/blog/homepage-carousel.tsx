"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { CSSProperties } from "react";
import type { PublicPostCardData } from "@/components/blog/public-post-card";

interface HomepageCarouselProps {
  id: string;
  eyebrow: string;
  title: string;
  posts: PublicPostCardData[];
  cardCount: 4 | 5 | 6;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function HomepageCarousel({
  id,
  eyebrow,
  title,
  posts,
  cardCount,
  viewAllHref,
  viewAllLabel,
}: HomepageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const carouselStyle = {
    "--homepage-carousel-card-width": `calc(${(100 / cardCount).toFixed(4)}% - ${(
      (18 * (cardCount - 1)) /
      cardCount
    ).toFixed(2)}px)`,
  } as CSSProperties & { "--homepage-carousel-card-width": string };

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!track || !(card instanceof HTMLElement)) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: "smooth",
    });
  }

  return (
    <section aria-labelledby={`${id}-heading`}>
      <div className="mb-5 flex items-end justify-between gap-4 border-b-2 border-[#02A95C] pb-3">
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#02A95C]">
            {eyebrow}
          </p>
          <h2
            id={`${id}-heading`}
            className="font-sans text-[clamp(23px,2.4vw,31px)] font-black leading-tight tracking-[-.04em] text-[#292929]"
          >
            {title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {viewAllHref && viewAllLabel && (
            <Link
              href={viewAllHref}
              data-analytics-event="blog-navigation"
              className="mr-1 hidden text-xs font-extrabold text-[#02A95C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C] sm:inline"
            >
              {viewAllLabel} <span aria-hidden="true">↗</span>
            </Link>
          )}
          <button
            type="button"
            aria-label={`Previous ${title.toLowerCase()}`}
            onClick={() => scroll(-1)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-[#d9e4df] bg-white text-[#333] transition hover:border-[#02A95C] hover:bg-[#02A95C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            aria-label={`Next ${title.toLowerCase()}`}
            onClick={() => scroll(1)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-[#d9e4df] bg-white text-[#333] transition hover:border-[#02A95C] hover:bg-[#02A95C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>

      {posts.length ? (
        <div
          ref={trackRef}
          style={carouselStyle}
          className="grid auto-cols-[minmax(175px,70%)] grid-flow-col snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[561px]:auto-cols-[minmax(200px,42%)] min-[561px]:gap-[18px] min-[901px]:auto-cols-[minmax(215px,var(--homepage-carousel-card-width))]"
        >
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.slug}`}
              data-analytics-event="post-card"
              aria-label={`Read ${post.title}`}
              className="group relative aspect-[4/5] min-w-0 snap-start overflow-hidden rounded-[5px] bg-[#608A89] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#02A95C]"
            >
              {post.thumbnail && (
                <Image
                  unoptimized
                  fill
                  src={post.thumbnail}
                  alt={post.title}
                  sizes="(min-width: 900px) 280px, (min-width: 560px) 42vw, 70vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.045]"
                />
              )}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-black/[.02] via-black/[.14] to-black/[.82]"
              />
              <span className="absolute inset-x-0 bottom-0 z-10 p-[13px] text-left sm:p-[18px]">
                <span className="mb-2 inline-block rounded-[2px] bg-[#02A95C] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.08em] text-white">
                  {post.categoryName}
                </span>
                <span className="block text-base font-extrabold leading-[1.2] sm:text-lg">
                  {post.title}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-[#f6f8f6] px-4 py-5 text-sm text-[#66716c]">
          No published stories are available in this section yet.
        </p>
      )}
    </section>
  );
}
