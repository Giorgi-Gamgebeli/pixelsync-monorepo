function FriendsListSkeleton() {
  return (
    <div className="flex flex-col gap-0.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-surface" />
          <div className="flex-1">
            <div className="mb-1.5 h-3.5 w-24 animate-pulse rounded bg-surface" />
            <div className="h-3 w-14 animate-pulse rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default FriendsListSkeleton;
