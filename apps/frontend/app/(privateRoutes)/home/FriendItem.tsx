"use client";

import ConfirmDialog from "@/app/_components/ConfirmDialog";
import UserAvatar from "@/app/_components/UserAvatar";
import { useSocketContext } from "@/app/_context/SocketContext";
import { getChatPageData } from "@/app/_dataAccessLayer/userActions";
import { usePrefetchQuery } from "@/app/_hooks/usePrefetchQuery";
import { dmChatKey } from "@/app/_lib/chatQueryKeys";
import { Icon } from "@iconify/react/dist/iconify.js";
import { UserStatus } from "@repo/types";
import { useEffect, useRef, useState } from "react";
import HomeNavLink from "./HomeNavLink";

const STATUS_LABELS: Record<UserStatus, string> = {
  ONLINE: "Online",
  IDLE: "Idle",
  DO_NOT_DISTURB: "Do Not Disturb",
  OFFLINE: "Offline",
};

type FriendItemProps = Readonly<{
  friend: {
    id: string;
    userName: string | null;
    status: UserStatus;
    avatarConfig?: string | null;
  };
}>;

function FriendItem({ friend }: FriendItemProps) {
  const { unfriend } = useSocketContext();
  const { prefetchQuery } = usePrefetchQuery();

  console.log("socket rerender useSocketContext");

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const prefetch = () => {
    prefetchQuery({
      queryKey: dmChatKey(friend.id),
      queryFn: () => getChatPageData(friend.id),
    });
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      <div className="group relative">
        <HomeNavLink href={`/home/${friend.id}`} prefetch={prefetch}>
          <UserAvatar
            userName={friend.userName}
            id={friend.id}
            size={32}
            showStatus
            status={friend.status}
            statusBorderColor="border-secondary"
            avatarConfig={friend.avatarConfig}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-gray-300">{friend.userName}</p>
            <p className="truncate text-xs text-gray-500">
              {STATUS_LABELS[friend.status]}
            </p>
          </div>
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
        onConfirm={() => {
          unfriend(friend.id);
        }}
        title="Remove Friend"
        message={`Are you sure you want to remove ${friend.userName || "this user"}?`}
        confirmLabel="Remove"
        danger
      />
    </>
  );
}

export default FriendItem;
