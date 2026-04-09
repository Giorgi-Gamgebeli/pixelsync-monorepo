"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import FriendRow from "./FriendRow";
import type { FriendsPageFriend } from "@/app/_lib/friendsQueryCache";

type AllFriendsProps = Readonly<{
  friends: FriendsPageFriend[];
}>;

function AllFriends({ friends }: AllFriendsProps) {
  if (!friends.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-surface mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Icon icon="mdi:account-plus" className="text-3xl text-gray-500" />
        </div>
        <p className="text-sm font-medium text-white">No friends yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Add friends to start collaborating together.
        </p>
      </div>
    );
  }

  // Sort: online first
  const sorted = [...friends].sort((a, b) => {
    if (a.status === "ONLINE" && b.status !== "ONLINE") return -1;
    if (a.status !== "ONLINE" && b.status === "ONLINE") return 1;
    return 0;
  });

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-500">
        All Friends &mdash; {friends.length}
      </p>
      <div className="flex flex-col">
        {sorted.map((friend) => (
          <FriendRow key={friend.id} {...friend} />
        ))}
      </div>
    </div>
  );
}

export default AllFriends;
