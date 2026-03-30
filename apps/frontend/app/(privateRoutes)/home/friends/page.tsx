import { Suspense } from "react";
import FriendsContent from "./FriendsContent";
import FriendsContentSkeleton from "./FriendsContentSkeleton";
import FriendsHeader from "./FriendsHeader";
function Page() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <FriendsHeader />
      <Suspense fallback={<FriendsContentSkeleton />}>
        <FriendsContent />
      </Suspense>
    </div>
  );
}

export default Page;
