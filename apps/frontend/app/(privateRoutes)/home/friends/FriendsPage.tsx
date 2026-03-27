"use client";

import { useState } from "react";
import { UserStatus } from "@repo/types";
import Filter from "./Filter";
import AddFriend from "./AddFriend";
import PendingFriends from "./PendingFriends";
import AllFriends from "./AllFriends";
import OnlineFriends from "./OnlineFriends";

type FriendsPageProps = {
  friends: {
    id: string;
    userName: string | null;
    status: UserStatus;
  }[];
  pendingFriendRequests:
    | {
        friendRequestsToThem: {
          userName: string | null;
          name: string | null;
          id: string;
        }[];
        friendRequestsToMe: {
          userName: string | null;
          name: string | null;
          id: string;
        }[];
      }
    | undefined;
};

function FriendsPage({ friends, pendingFriendRequests }: FriendsPageProps) {
  const [activeFilter, setActiveFilter] = useState("online");

  const hasPending = !!(
    pendingFriendRequests?.friendRequestsToThem.length ||
    pendingFriendRequests?.friendRequestsToMe.length
  );

  let content;
  if (activeFilter === "addfriend") content = <AddFriend />;
  else if (activeFilter === "pending")
    content = <PendingFriends pendingFriendsRequests={pendingFriendRequests} />;
  else if (activeFilter === "all") content = <AllFriends friends={friends} />;
  else content = <OnlineFriends friends={friends} />;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="border-border flex items-center justify-between border-b px-8 py-4">
        <h1 className="text-lg font-semibold text-white">Friends</h1>
        <Filter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          pendingFriendRequests={hasPending}
        />
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-8 py-6">
        {content}
      </div>
    </div>
  );
}

export default FriendsPage;
