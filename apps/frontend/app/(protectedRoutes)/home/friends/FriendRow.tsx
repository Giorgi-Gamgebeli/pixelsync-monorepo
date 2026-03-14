"use client";

import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import { UserStatus } from "@repo/types";
import UserAvatar from "@/app/_components/UserAvatar";

type FriendRowProps = {
  id: string;
  userName: string | null;
  status: UserStatus;
  actions?: React.ReactNode;
};

function FriendRow({ id, userName, status, actions }: FriendRowProps) {
  const isOnline = status === "ONLINE";

  return (
    <div className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface">
      <Link href={`/home/${id}`} className="flex items-center gap-3">
        <UserAvatar
          userName={userName}
          id={id}
          size={40}
          showStatus
          status={status}
        />
        <div>
          <p className="text-sm font-medium text-gray-200">{userName}</p>
          <p className="text-xs text-gray-500">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        {actions || (
          <>
            <Link
              href={`/home/${id}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-gray-400 transition-colors hover:bg-border hover:text-white"
            >
              <Icon icon="mdi:message" className="text-lg" />
            </Link>
            <button className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface text-gray-400 transition-colors hover:bg-border hover:text-white">
              <Icon icon="mdi:dots-vertical" className="text-lg" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default FriendRow;
