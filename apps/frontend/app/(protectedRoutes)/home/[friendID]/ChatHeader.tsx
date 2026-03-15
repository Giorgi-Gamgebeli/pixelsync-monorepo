"use client";

import { useState } from "react";
import { UserStatus } from "@repo/types";
import UserAvatar from "@/app/_components/UserAvatar";
import FriendProfilePanel from "@/app/_components/FriendProfilePanel";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useSocketContext } from "@/app/_context/SocketContext";
import { useCallContext } from "@/app/_context/CallContext";

type ChatHeaderProps = {
  friend: {
    id: string;
    userName: string | null;
    status: UserStatus;
    avatarConfig?: string | null;
  };
};

function ChatHeader({ friend }: ChatHeaderProps) {
  const { statusMap, profileMap } = useSocketContext();
  const { initiateCall } = useCallContext();
  const [profileOpen, setProfileOpen] = useState(false);
  const status = statusMap[friend.id] ?? friend.status;
  const isOnline = status === "ONLINE";

  const profile = profileMap[friend.id];
  const displayUserName = profile?.userName ?? friend.userName;
  const displayAvatarConfig = profile?.avatarConfig ?? friend.avatarConfig;

  const liveFriend = {
    ...friend,
    userName: displayUserName,
    avatarConfig: displayAvatarConfig,
  };

  return (
    <>
      <div className="border-border flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setProfileOpen(true)}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <UserAvatar
              userName={displayUserName}
              id={friend.id}
              avatarConfig={displayAvatarConfig}
              size={32}
              showStatus
              status={status}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-white">{displayUserName}</p>
            <p className="text-xs text-gray-500">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Voice call"
            onClick={() => initiateCall(friend.id, "audio")}
            className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
          >
            <Icon icon="mdi:phone" className="text-lg" />
          </button>
          <button
            aria-label="Video call"
            onClick={() => initiateCall(friend.id, "video")}
            className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
          >
            <Icon icon="mdi:video" className="text-lg" />
          </button>
          <button
            aria-label="More options"
            className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
          >
            <Icon icon="mdi:dots-vertical" className="text-lg" />
          </button>
        </div>
      </div>

      <FriendProfilePanel
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        friend={liveFriend}
      />
    </>
  );
}

export default ChatHeader;
