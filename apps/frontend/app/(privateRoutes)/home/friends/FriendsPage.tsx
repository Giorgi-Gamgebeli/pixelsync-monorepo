"use client";

import type { ReactNode } from "react";
import { UserStatus } from "@repo/types";
import AddFriend from "./AddFriend";
import PendingFriends from "./PendingFriends";
import AllFriends from "./AllFriends";
import OnlineFriends from "./OnlineFriends";

type FriendsPageProps = Readonly<{
  activeFilter: string;
  friends: {
    id: string;
    userName: string | null;
    status: UserStatus;
    avatarConfig?: string | null;
  }[];
  pendingFriendRequests:
    | {
        friendRequestsToThem: {
          userName: string | null;
          name: string | null;
          id: string;
          avatarConfig?: string | null;
        }[];
        friendRequestsToMe: {
          userName: string | null;
          name: string | null;
          id: string;
          avatarConfig?: string | null;
        }[];
      }
    | undefined;
}>;

function FriendsPage({
  activeFilter,
  friends,
  pendingFriendRequests,
}: FriendsPageProps) {
  let content: ReactNode;
  if (activeFilter === "addfriend") content = <AddFriend />;
  else if (activeFilter === "pending")
    content = <PendingFriends pendingFriendsRequests={pendingFriendRequests} />;
  else if (activeFilter === "all") content = <AllFriends friends={friends} />;
  else content = <OnlineFriends friends={friends} />;

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto px-8 py-6">
      {content}
    </div>
  );
}

export default FriendsPage;
