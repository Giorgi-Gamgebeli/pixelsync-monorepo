function FriendsPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-8 py-4">
        <div className="h-6 w-20 animate-pulse rounded bg-surface" />
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-16 animate-pulse rounded-lg bg-surface" />
          <div className="h-8 w-12 animate-pulse rounded-lg bg-surface" />
          <div className="mx-1 h-5 w-px bg-border" />
          <div className="h-8 w-24 animate-pulse rounded-lg bg-surface" />
        </div>
      </div>
      <div className="px-8 py-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg px-3 py-2"
          >
            <div className="h-10 w-10 animate-pulse rounded-full bg-surface" />
            <div className="flex-1">
              <div className="mb-1.5 h-4 w-28 animate-pulse rounded bg-surface" />
              <div className="h-3 w-16 animate-pulse rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FriendsPageSkeleton;
