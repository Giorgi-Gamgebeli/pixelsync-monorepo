function Loading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Chat header skeleton */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-surface" />
          <div>
            <div className="mb-1.5 h-4 w-24 animate-pulse rounded bg-surface" />
            <div className="h-3 w-14 animate-pulse rounded bg-surface" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-surface" />
          <div className="h-8 w-8 animate-pulse rounded-lg bg-surface" />
        </div>
      </div>

      {/* Messages area skeleton */}
      <div className="flex flex-1 flex-col justify-end gap-3 overflow-hidden px-6 py-4">
        {/* Incoming message */}
        <div className="flex flex-col items-start">
          <div className="mb-1 h-3 w-16 animate-pulse rounded bg-surface" />
          <div className="h-10 w-52 animate-pulse rounded-lg bg-surface" />
        </div>
        {/* Own message */}
        <div className="flex flex-col items-end">
          <div className="mb-1 h-3 w-8 animate-pulse rounded bg-surface" />
          <div className="h-10 w-64 animate-pulse rounded-lg bg-surface" />
        </div>
        {/* Incoming message */}
        <div className="flex flex-col items-start">
          <div className="mb-1 h-3 w-16 animate-pulse rounded bg-surface" />
          <div className="h-16 w-72 animate-pulse rounded-lg bg-surface" />
        </div>
        {/* Own message */}
        <div className="flex flex-col items-end">
          <div className="mb-1 h-3 w-8 animate-pulse rounded bg-surface" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-surface" />
        </div>
      </div>

      {/* Input bar skeleton */}
      <div className="border-t border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface" />
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-surface" />
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface" />
        </div>
      </div>
    </div>
  );
}

export default Loading;
