"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { PublicPostCardData } from "@/components/blog/public-post-card";

interface RelatedArticlesProps {
  posts: PublicPostCardData[];
  categoryName: string;
}

export function RelatedArticles({
  posts,
  categoryName,
}: RelatedArticlesProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  if (!posts.length) return null;

  function scrollTrack(direction: -1 | 1) {
    trackRef.current?.scrollBy({
      left: direction * trackRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  }

  return (
    <section className="mt-10" aria-labelledby="related-articles-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2
          id="related-articles-heading"
          className="font-sans text-xl font-extrabold text-[#26332c] sm:text-2xl"
        >
          Related {categoryName} Stories
        </h2>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label="Scroll to previous related articles"
            onClick={() => scrollTrack(-1)}
            className="size-10 rounded-full border border-[#dfe8e2] bg-white text-xl text-[#444] hover:border-[#02A95C] hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            aria-label="Scroll to next related articles"
            onClick={() => scrollTrack(1)}
            className="size-10 rounded-full border border-[#dfe8e2] bg-white text-xl text-[#444] hover:border-[#02A95C] hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="grid auto-cols-[calc((100%-2.25rem)/3)] grid-flow-col gap-[18px] overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:auto-cols-[calc((100%-1.125rem)/2)] max-[720px]:auto-cols-[78%]"
      >
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.slug}`}
            data-analytics-event="post-card"
            className="group relative h-[220px] min-w-0 snap-start overflow-hidden rounded-lg bg-[#dfe9e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
          >
            {post.thumbnail && (
              <Image
                unoptimized
                src={post.thumbnail}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 240px, 78vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            )}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#101b17]/90"
            />
            <span className="absolute inset-x-3.5 bottom-3.5 z-10 text-[17px] font-bold leading-snug text-white">
              {post.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
