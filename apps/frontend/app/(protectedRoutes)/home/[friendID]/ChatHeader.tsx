"use client";

import { UserStatus } from "@repo/types";
import UserAvatar from "@/app/_components/UserAvatar";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useSocketContext } from "@/app/_context/SocketContext";

type ChatHeaderProps = {
  friend: {
    id: string;
    userName: string | null;
    status: UserStatus;
    avatarConfig?: string | null;
  };
};

function ChatHeader({ friend }: ChatHeaderProps) {
  const { statusMap } = useSocketContext();
  const status = statusMap[friend.id] ?? friend.status;
  const isOnline = status === "ONLINE";

  return (
    <div className="border-border flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-3">
        <UserAvatar
          userName={friend.userName}
          id={friend.id}
          avatarConfig={friend.avatarConfig}
          size={32}
          showStatus
          status={status}
        />
        <div>
          <p className="text-sm font-medium text-white">{friend.userName}</p>
          <p className="text-xs text-gray-500">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          aria-label="Call"
          className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
        >
          <Icon icon="mdi:phone" className="text-lg" />
        </button>
        <button
          aria-label="More options"
          className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
        >
          <Icon icon="mdi:dots-vertical" className="text-lg" />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
