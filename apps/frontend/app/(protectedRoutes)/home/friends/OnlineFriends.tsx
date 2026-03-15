"use client";

import { UserStatus } from "@repo/types";
import { Icon } from "@iconify/react/dist/iconify.js";
import FriendRow from "./FriendRow";
import { useSocket } from "@/app/_context/SocketContext";

type OnlineFriendsProps = {
  friends:
  | {
    id: string;
    userName: string | null;
    status: UserStatus;
    avatarConfig?: string | null;
  }[]
  | undefined;
};

function OnlineFriends({ friends: unsortedFriends }: OnlineFriendsProps) {
  const { statusMap } = useSocket();
  const friends = unsortedFriends?.filter((f) => {
    const liveStatus = statusMap[f.id] ?? f.status;
    return liveStatus === "ONLINE";
  });

  if (!friends?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
          <Icon icon="mdi:account-off" className="text-3xl text-gray-500" />
        </div>
        <p className="text-sm font-medium text-white">
          No friends online right now
        </p>
        <p className="mt-1 text-sm text-gray-500">
          When your friends come online, they&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-500">
        Online &mdash; {friends.length}
      </p>
      <div className="flex flex-col">
        {friends.map((friend) => (
          <FriendRow key={friend.id} {...friend} />
        ))}
      </div>
    </div>
  );
}

export default OnlineFriends;
