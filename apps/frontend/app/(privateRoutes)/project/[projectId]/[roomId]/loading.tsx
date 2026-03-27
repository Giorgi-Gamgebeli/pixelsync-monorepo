function Loading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Room header skeleton */}
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-surface h-5 w-32 animate-pulse rounded" />
          <div className="flex items-center gap-1.5">
            <div className="bg-surface h-1.5 w-1.5 animate-pulse rounded-full" />
            <div className="bg-surface h-3.5 w-16 animate-pulse rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-surface h-8 w-8 animate-pulse rounded-lg" />
          <div className="bg-surface h-8 w-8 animate-pulse rounded-lg" />
        </div>
      </div>

      {/* Canvas area skeleton */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-surface h-10 w-10 animate-pulse rounded-xl" />
          <div className="bg-surface h-4 w-40 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}

export default Loading;
