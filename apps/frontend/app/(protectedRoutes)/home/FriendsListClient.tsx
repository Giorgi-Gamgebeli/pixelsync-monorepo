"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserStatus } from "@repo/types";
import { Icon } from "@iconify/react/dist/iconify.js";
import UserAvatar from "@/app/_components/UserAvatar";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import HomeNavLink from "./HomeNavLink";
import { useSocketContext } from "@/app/_context/SocketContext";
import { unfriend } from "@/app/_dataAccessLayer/userActions";

const STATUS_LABELS: Record<UserStatus, string> = {
  ONLINE: "Online",
  IDLE: "Idle",
  DO_NOT_DISTURB: "Do Not Disturb",
  OFFLINE: "Offline",
};

type Friend = {
  id: string;
  userName: string | null;
  status: UserStatus;
  avatarConfig?: string | null;
};

function FriendItem({ friend }: { friend: Friend }) {
  const { statusMap, unreadMap, profileMap, markAsRead } = useSocketContext();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const profile = profileMap[friend.id];
  const displayUserName = profile?.userName ?? friend.userName;
  const displayAvatarConfig = profile?.avatarConfig ?? friend.avatarConfig;
  const status = statusMap[friend.id] ?? friend.status;
  const unread = unreadMap[friend.id] ?? 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleMouseLeave = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <div className="group relative" onMouseLeave={handleMouseLeave}>
        <HomeNavLink chatView={{ type: "dm", friendId: friend.id }}>
          <UserAvatar
            userName={displayUserName}
            id={friend.id}
            size={32}
            showStatus
            status={status}
            statusBorderColor="border-secondary"
            avatarConfig={displayAvatarConfig}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-gray-300">{displayUserName}</p>
            <p className="truncate text-xs text-gray-500">
              {STATUS_LABELS[status]}
            </p>
          </div>
          {unread > 0 && (
            <span className="bg-brand-500 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </HomeNavLink>

        {/* Three-dot menu */}
        <div
          ref={menuRef}
          className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="hover:bg-surface flex h-6 w-6 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-white"
          >
            <Icon icon="mdi:dots-vertical" className="text-sm" />
          </button>

          {menuOpen && (
            <div className="border-border bg-secondary absolute top-full right-0 z-50 mt-1 w-44 rounded-xl border p-1.5 shadow-xl">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(false);
                  markAsRead(friend.id);
                }}
                className="hover:bg-surface flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:text-white"
              >
                <Icon icon="mdi:email-check" className="text-base" />
                Mark as Read
              </button>
              <div className="border-border my-1 border-t" />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
                className="hover:bg-surface flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:text-red-300"
              >
                <Icon icon="mdi:account-remove" className="text-base" />
                Remove Friend
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await unfriend({ id: friend.id });
          router.refresh();
        }}
        title="Remove Friend"
        message={`Are you sure you want to remove ${displayUserName || "this user"}?`}
        confirmLabel="Remove"
        danger
      />
    </>
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
