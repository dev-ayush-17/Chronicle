export function EvidenceSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm"
        >
          {/* Header skeleton */}
          <div className="flex justify-between items-start mb-6 border-b border-surface-container-high pb-4">
            <div className="skeleton-block h-6 w-32 rounded-[0.25rem]" />
            <div className="skeleton-block h-6 w-16 rounded-full" />
          </div>

          {/* Body skeleton */}
          <div className="space-y-4">
            <div className="skeleton-block h-4 w-full rounded-[0.25rem]" />
            <div className="skeleton-block h-4 w-5/6 rounded-[0.25rem]" />
            <div className="skeleton-block h-4 w-4/6 rounded-[0.25rem]" />
          </div>

          {/* Footer skeleton */}
          <div className="mt-6 pt-4 border-t border-surface-container-high flex gap-3">
            <div className="skeleton-block h-8 w-24 rounded-[0.25rem]" />
            <div className="skeleton-block h-8 w-24 rounded-[0.25rem]" />
          </div>
        </div>
      ))}
    </div>
  );
}
