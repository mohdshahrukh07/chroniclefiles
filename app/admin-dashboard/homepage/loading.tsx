export default function HomepageManagementLoading() {
  return (
    <div
      role="status"
      aria-label="Loading Homepage Management"
      className="min-h-screen bg-gray-50 p-4 text-[#444444] sm:p-6 lg:ml-64 lg:p-8"
    >
      <span className="sr-only">Loading Homepage Management...</span>
      <div className="mb-6 h-16 animate-pulse rounded-lg bg-white" />
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-5 sm:p-6">
          <div className="h-6 w-56 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 h-4 max-w-2xl animate-pulse rounded bg-gray-100" />
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="min-h-48 animate-pulse rounded-xl border border-gray-200 p-4"
            >
              <div className="mb-4 h-4 w-2/3 rounded bg-gray-100" />
              <div className="h-[88px] rounded-lg bg-gray-100" />
              <div className="mt-3 h-11 rounded-lg bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
