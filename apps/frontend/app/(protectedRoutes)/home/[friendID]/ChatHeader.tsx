"use client";

import { useState, useRef, useEffect } from "react";
import { UserStatus } from "@repo/types";
import UserAvatar from "@/app/_components/UserAvatar";
import FriendProfilePanel from "@/app/_components/FriendProfilePanel";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useSocketContext } from "@/app/_context/SocketContext";
import { useCallContext } from "@/app/_context/CallContext";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<UserStatus, string> = {
  ONLINE: "Online",
  IDLE: "Idle",
  DO_NOT_DISTURB: "Do Not Disturb",
  OFFLINE: "Offline",
};

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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const status = statusMap[friend.id] ?? friend.status;

  const profile = profileMap[friend.id];
  const displayUserName = profile?.userName ?? friend.userName;
  const displayAvatarConfig = profile?.avatarConfig ?? friend.avatarConfig;

  const liveFriend = {
    ...friend,
    userName: displayUserName,
    avatarConfig: displayAvatarConfig,
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVoiceCall = () => {
    initiateCall(friend.id, "audio");
  };

  const handleVideoCall = () => {
    initiateCall(friend.id, "video");
  };

  const handleViewProfile = () => {
    setMoreMenuOpen(false);
    setProfileOpen(true);
  };

  const handleBlockUser = () => {
    setMoreMenuOpen(false);
    toast.error("Coming soon!");
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
            <p className="text-xs text-gray-500">{STATUS_LABELS[status]}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Voice call"
            onClick={handleVoiceCall}
            className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
          >
            <Icon icon="mdi:phone" className="text-lg" />
          </button>
          <button
            aria-label="Video call"
            onClick={handleVideoCall}
            className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
          >
            <Icon icon="mdi:video" className="text-lg" />
          </button>
          <div className="relative" ref={moreMenuRef}>
            <button
              aria-label="More options"
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
            >
              <Icon icon="mdi:dots-vertical" className="text-lg" />
            </button>
            {moreMenuOpen && (
              <div className="border-border bg-secondary absolute top-full right-0 z-50 mt-1 w-40 rounded-lg border py-1 shadow-xl">
                <button
                  onClick={handleViewProfile}
                  className="hover:bg-surface flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  <Icon icon="mdi:account" className="text-base" />
                  View profile
                </button>
                <button
                  onClick={handleBlockUser}
                  className="hover:bg-surface flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  <Icon icon="mdi:block-helper" className="text-base" />
                  Block user
                </button>
              </div>
            )}
          </div>
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
