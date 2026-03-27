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

const STATUS_LABELS: Record<UserStatus, string> = {
  ONLINE: "Online",
  IDLE: "Idle",
  DO_NOT_DISTURB: "Do Not Disturb",
  OFFLINE: "Offline",
};

type FriendRowProps = {
  id: string;
  userName: string | null;
  status: UserStatus;
  avatarConfig?: string | null;
  actions?: React.ReactNode;
};

function FriendRow({
  id,
  userName,
  status: serverStatus,
  avatarConfig,
  actions,
}: FriendRowProps) {
  const { statusMap, profileMap, markAsRead } = useSocketContext();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const profile = profileMap[id];
  const displayUserName = profile?.userName ?? userName;
  const displayAvatarConfig = profile?.avatarConfig ?? avatarConfig;
  const status = statusMap[id] ?? serverStatus;

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
      <div
        className="group hover:bg-surface relative flex items-center rounded-lg transition-colors"
        onMouseLeave={handleMouseLeave}
      >
        <Link
          href={`/home/${id}`}
          className="flex flex-1 items-center gap-3 px-3 py-2"
        >
          <UserAvatar
            userName={displayUserName}
            id={id}
            avatarConfig={displayAvatarConfig}
            size={40}
            showStatus
            status={status}
          />
          <div>
            <p className="text-sm font-medium text-gray-200">
              {displayUserName}
            </p>
            <p className="text-xs text-gray-500">{STATUS_LABELS[status]}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 pr-3 opacity-0 transition-opacity group-hover:opacity-100">
          {actions || (
            <>
              <Link
                href={`/home/${id}`}
                className="bg-surface hover:bg-border flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-white"
              >
                <Icon icon="mdi:message" className="text-lg" />
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="bg-surface hover:bg-border flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:text-white"
                >
                  <Icon icon="mdi:dots-vertical" className="text-lg" />
                </button>

                {menuOpen && (
                  <div className="border-border bg-secondary absolute top-full right-0 z-50 mt-1 w-44 rounded-xl border p-1.5 shadow-xl">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        markAsRead(id);
                      }}
                      className="hover:bg-surface flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:text-white"
                    >
                      <Icon icon="mdi:email-check" className="text-base" />
                      Mark as Read
                    </button>
                    <div className="border-border my-1 border-t" />
                    <button
                      onClick={() => {
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
