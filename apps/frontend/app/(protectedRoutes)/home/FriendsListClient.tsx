"use client";

import { UserStatus } from "@repo/types";
import UserAvatar from "@/app/_components/UserAvatar";
import HomeNavLink from "./HomeNavLink";
import { useSocketContext } from "@/app/_context/SocketContext";

type Friend = {
  id: string;
  userName: string | null;
  status: UserStatus;
  avatarConfig?: string | null;
};

function FriendItem({ friend }: { friend: Friend }) {
  const { statusMap } = useSocketContext();
  const status = statusMap[friend.id] ?? friend.status;

  return (
    <HomeNavLink href={`/home/${friend.id}`}>
      <UserAvatar
        userName={friend.userName}
        id={friend.id}
        size={32}
        showStatus
        status={status}
        statusBorderColor="border-secondary"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-gray-300">{friend.userName}</p>
        <p className="truncate text-xs text-gray-500">
          {status === "ONLINE" ? "Online" : "Offline"}
        </p>
      </div>
    </HomeNavLink>
  );
}

function FriendsListClient({ friends }: { friends: Friend[] }) {
  if (friends.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-gray-500">
        No conversations yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {friends.map((friend) => (
        <FriendItem key={friend.id} friend={friend} />
      ))}
    </div>
  );
}

export default FriendsListClient;
