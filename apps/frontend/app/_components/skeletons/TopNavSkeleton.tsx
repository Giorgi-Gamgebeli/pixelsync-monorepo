function TopNavSkeleton() {
  return (
    <nav className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-secondary px-5">
      <div className="flex items-center gap-6">
        <div className="h-[26px] w-[26px] animate-pulse rounded-lg bg-surface" />
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 animate-pulse rounded-lg bg-surface" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-surface" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-surface" />
        <div className="h-8 w-8 animate-pulse rounded-lg bg-surface" />
        <div className="ml-1 h-5 w-px bg-border" />
        <div className="h-8 w-8 animate-pulse rounded-full bg-surface" />
      </div>
    </nav>
  );
}

export default TopNavSkeleton;
