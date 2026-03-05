"use client";

import Image from "next/image";
import Link from "next/link";
import defaultUser from "@/public/default-user.jpg";
import { Icon } from "@iconify/react/dist/iconify.js";
import { UserStatus } from "@repo/types";

type FriendRowProps = {
  id: string;
  userName: string | null;
  image: string | null;
  status: UserStatus;
  actions?: React.ReactNode;
};

function FriendRow({ id, userName, image, status, actions }: FriendRowProps) {
  const isOnline = status === "ONLINE";

  return (
    <div className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface">
      <Link href={`/home/${id}`} className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0">
          <Image
            fill
            src={image || defaultUser}
            alt={userName || "user"}
            className="rounded-full object-cover"
          />
          {isOnline && (
            <div className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-green-500" />
          )}
        </div>
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
