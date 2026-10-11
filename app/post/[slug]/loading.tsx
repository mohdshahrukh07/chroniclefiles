import { PublicSiteFooter, PublicSiteHeader } from "@/components/blog/public-site-header";

export default function PublicPostLoading() {
  return (
    <>
      <PublicSiteHeader />
      <main
        aria-label="Loading article"
        aria-busy="true"
        className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-6"
      >
        <div className="grid grid-cols-1 gap-8 min-[768px]:grid-cols-[minmax(0,1fr)_260px] min-[901px]:grid-cols-[minmax(0,1fr)_300px]">
          <div className="motion-safe:animate-pulse">
            <div className="h-4 w-28 rounded bg-[#E8F2F4]" />
            <div className="mt-5 h-12 max-w-3xl rounded bg-[#E8F2F4]" />
            <div className="mt-3 h-7 max-w-2xl rounded bg-[#E8F2F4]" />
            <div className="mt-6 aspect-video w-full rounded-xl bg-[#E8F2F4]" />
            <div className="mt-8 space-y-3">
              <div className="h-4 rounded bg-[#E8F2F4]" />
              <div className="h-4 rounded bg-[#E8F2F4]" />
              <div className="h-4 w-4/5 rounded bg-[#E8F2F4]" />
            </div>
          </div>
          <div className="hidden motion-safe:animate-pulse space-y-4 min-[768px]:block">
            <div className="aspect-square rounded-lg bg-[#E8F2F4]" />
            <div className="h-6 rounded bg-[#E8F2F4]" />
            <div className="h-20 rounded bg-[#E8F2F4]" />
          </div>
        </div>
      </main>
      <PublicSiteFooter />
    </>
  );
}
