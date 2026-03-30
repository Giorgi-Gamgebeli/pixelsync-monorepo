"use client";

function FriendsContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden px-8 py-6">
      <div className="flex flex-col gap-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="bg-surface h-10 w-10 animate-pulse rounded-full" />
            <div className="flex-1">
              <div className="bg-surface mb-1.5 h-4 w-28 animate-pulse rounded" />
              <div className="bg-surface h-3 w-16 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FriendsContentSkeleton;
