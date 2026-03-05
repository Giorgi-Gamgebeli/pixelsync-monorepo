import {
  getFriends,
  getPendingFriendRequests,
} from "@/app/_dataAcessLayer/userActions";
import Friends from "./Friends";
import Filter from "./Filter";
import { Suspense } from "react";

export const revalidate = 0;

async function Page() {
  const friends = await getFriends();
  const pendingFriendRequests = await getPendingFriendRequests();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-8 py-4">
        <h1 className="text-lg font-semibold text-white">Friends</h1>
        <Filter
          pendingFriendRequests={
            !!(
              pendingFriendRequests?.friendRequestsToThem.length ||
              pendingFriendRequests?.friendRequestsToMe.length
            )
          }
        />
      </div>

      {/* Content */}
      <div className="scrollbar-thin flex-1 overflow-y-auto px-8 py-6">
        <Suspense fallback={null}>
          <Friends
            pendingFriendsRequests={pendingFriendRequests!}
            friends={friends}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default Page;
