import Link from "next/link";
import {
  PublicSiteFooter,
  PublicSiteHeader,
} from "@/components/blog/public-site-header";

export default function PublicCategoryNotFound() {
  return (
    <>
      <PublicSiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#608A89]">
          Category unavailable
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#252d29]">
          We couldn&apos;t find that category
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-[#66716c]">
          The category may have been removed or its address may have changed.
        </p>
        <Link
          href="/blog"
          className="mt-7 inline-flex min-h-11 items-center rounded-md bg-[#02A95C] px-5 font-semibold text-white hover:bg-[#078b50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C] focus-visible:ring-offset-2"
        >
          Browse latest articles
        </Link>
      </main>
      <PublicSiteFooter />
    </>
  );
}
