"use client";

import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useRouter } from "next/navigation";
import { UserStatus } from "@repo/types";
import { useSocketContext } from "../_context/SocketContext";
import { unfriend } from "../_dataAccessLayer/userActions";
import UserAvatar from "./UserAvatar";
import ConfirmDialog from "./ConfirmDialog";

type FriendProfilePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  friend: {
    id: string;
    userName: string | null;
    status: UserStatus;
    avatarConfig?: string | null;
  };
};

function FriendProfilePanel({
  isOpen,
  onClose,
  friend,
}: FriendProfilePanelProps) {
  const { statusMap } = useSocketContext();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const status = statusMap[friend.id] ?? friend.status;
  const isOnline = status === "ONLINE";

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[80] flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative h-full w-80 border-l border-border bg-secondary shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-bold text-white">Profile</h2>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-surface hover:text-white"
              >
                <Icon icon="mdi:close" className="text-lg" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <UserAvatar
                  userName={friend.userName}
                  id={friend.id}
                  avatarConfig={friend.avatarConfig}
                  size={120}
                />

                <h3 className="mt-4 text-xl font-bold text-white">
                  {friend.userName}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-500"}`}
                  />
                  <span className="text-sm text-gray-400">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              <div className="my-6 border-t border-border" />

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Icon icon="mdi:account-remove" className="text-lg" />
                  Remove Friend
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await unfriend({ id: friend.id });
          onClose();
          router.push("/home/friends");
        }}
        title="Remove Friend"
        message={`Are you sure you want to remove ${friend.userName || "this user"}? You won't be able to message them anymore.`}
        confirmLabel="Remove"
        danger
      />
    </>
  );
}

export default FriendProfilePanel;
