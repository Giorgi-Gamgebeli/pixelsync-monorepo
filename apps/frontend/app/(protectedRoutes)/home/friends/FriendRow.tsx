"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import { UserStatus } from "@repo/types";
import UserAvatar from "@/app/_components/UserAvatar";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import { useSocketContext } from "@/app/_context/SocketContext";
import { unfriend } from "@/app/_dataAccessLayer/userActions";

type FriendRowProps = {
  id: string;
  userName: string | null;
  status: UserStatus;
  avatarConfig?: string | null;
  actions?: React.ReactNode;
};

function FriendRow({ id, userName, status: serverStatus, avatarConfig, actions }: FriendRowProps) {
  const { statusMap, profileMap, markAsRead } = useSocketContext();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const profile = profileMap[id];
  const displayUserName = profile?.userName ?? userName;
  const displayAvatarConfig = profile?.avatarConfig ?? avatarConfig;
  const status = statusMap[id] ?? serverStatus;
  const isOnline = status === "ONLINE";

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
      <div className="group relative flex items-center rounded-lg transition-colors hover:bg-surface">
        <Link href={`/home/${id}`} className="flex flex-1 items-center gap-3 px-3 py-2">
          <UserAvatar
            userName={displayUserName}
            id={id}
            avatarConfig={displayAvatarConfig}
            size={40}
            showStatus
            status={status}
          />
          <div>
            <p className="text-sm font-medium text-gray-200">{displayUserName}</p>
            <p className="text-xs text-gray-500">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 pr-3 opacity-0 transition-opacity group-hover:opacity-100">
          {actions || (
            <>
              <Link
                href={`/home/${id}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-gray-400 transition-colors hover:bg-border hover:text-white"
              >
                <Icon icon="mdi:message" className="text-lg" />
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface text-gray-400 transition-colors hover:bg-border hover:text-white"
                >
                  <Icon icon="mdi:dots-vertical" className="text-lg" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-border bg-secondary p-1.5 shadow-xl">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        markAsRead(id);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-surface hover:text-white"
                    >
                      <Icon icon="mdi:email-check" className="text-base" />
                      Mark as Read
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-surface hover:text-red-300"
                    >
                      <Icon icon="mdi:account-remove" className="text-base" />
                      Remove Friend
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await unfriend({ id });
          router.refresh();
        }}
        title="Remove Friend"
        message={`Are you sure you want to remove ${displayUserName || "this user"}? You won't be able to message them anymore.`}
        confirmLabel="Remove"
        danger
      />
    </>
  );
}

export default FriendRow;
