function ChatSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Chat header skeleton */}
      <div className="border-border flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-surface h-8 w-8 animate-pulse rounded-full" />
          <div>
            <div className="bg-surface mb-1.5 h-4 w-24 animate-pulse rounded" />
            <div className="bg-surface h-3 w-14 animate-pulse rounded" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-surface h-8 w-8 animate-pulse rounded-lg" />
          <div className="bg-surface h-8 w-8 animate-pulse rounded-lg" />
        </div>
      </div>

      {/* Messages area skeleton */}
      <div className="flex flex-1 flex-col justify-end gap-3 overflow-hidden px-6 py-4">
        <div className="flex flex-col items-start">
          <div className="bg-surface mb-1 h-3 w-16 animate-pulse rounded" />
          <div className="bg-surface h-10 w-52 animate-pulse rounded-lg" />
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-surface mb-1 h-3 w-8 animate-pulse rounded" />
          <div className="bg-surface h-10 w-64 animate-pulse rounded-lg" />
        </div>
        <div className="flex flex-col items-start">
          <div className="bg-surface mb-1 h-3 w-16 animate-pulse rounded" />
          <div className="bg-surface h-16 w-72 animate-pulse rounded-lg" />
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-surface mb-1 h-3 w-8 animate-pulse rounded" />
          <div className="bg-surface h-10 w-40 animate-pulse rounded-lg" />
        </div>
      </div>

      {/* Input bar skeleton */}
      <div className="border-border border-t px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-surface h-9 w-9 shrink-0 animate-pulse rounded-full" />
          <div className="bg-surface h-10 flex-1 animate-pulse rounded-lg" />
          <div className="bg-surface h-9 w-9 shrink-0 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default ChatSkeleton;
