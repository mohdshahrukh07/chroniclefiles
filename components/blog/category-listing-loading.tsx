import {
  PublicSiteFooter,
  PublicSiteHeader,
} from "@/components/blog/public-site-header";

export function CategoryListingLoading() {
  return (
    <>
      <PublicSiteHeader />
      <main
        aria-label="Loading articles"
        aria-busy="true"
        className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-6 sm:px-6 lg:px-8"
      >
        <div className="motion-safe:animate-pulse">
          <div className="h-4 w-40 rounded bg-[#E8F2F4]" />
          <div className="mt-8 h-20 rounded bg-[#E8F2F4]" />
          <div className="mt-5 h-10 w-2/3 rounded bg-[#E8F2F4]" />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="aspect-[5/4] rounded bg-[#E8F2F4]"
              />
            ))}
          </div>
        </div>
      </main>
      <PublicSiteFooter />
    </>
  );
}
