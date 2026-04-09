"use client";

import type { ReactNode } from "react";
import PendingFriends from "./PendingFriends";
import AllFriends from "./AllFriends";
import OnlineFriends from "./OnlineFriends";
import type { FriendsPageFriend } from "@/app/_lib/friendsQueryCache";

type FriendsPageProps = Readonly<{
  activeFilter: "online" | "all" | "pending";
  friends: FriendsPageFriend[];
}>;

function FriendsPage({ activeFilter, friends }: FriendsPageProps) {
  let content: ReactNode;
  if (activeFilter === "pending") content = <PendingFriends />;
  else if (activeFilter === "all") content = <AllFriends friends={friends} />;
  else content = <OnlineFriends friends={friends} />;

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto px-8 py-6">
      {content}
    </div>
  );
}

export default FriendsPage;
