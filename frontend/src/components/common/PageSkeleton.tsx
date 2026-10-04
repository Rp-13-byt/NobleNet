export function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl animate-pulse space-y-8" role="status" aria-label="Loading content">
      <div className="h-8 bg-neutral-200 rounded-md w-1/3"></div>
      <div className="h-4 bg-neutral-200 rounded-md w-1/2"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="h-48 bg-neutral-200 rounded-xl"></div>
        <div className="h-48 bg-neutral-200 rounded-xl"></div>
        <div className="h-48 bg-neutral-200 rounded-xl"></div>
      </div>
      <div className="h-64 bg-neutral-200 rounded-xl"></div>
      <span className="sr-only">Loading page content...</span>
    </div>
  );
}
