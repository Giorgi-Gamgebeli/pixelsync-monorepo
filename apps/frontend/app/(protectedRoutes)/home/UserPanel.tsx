"use client";

import { useSession } from "next-auth/react";
import UserAvatar from "@/app/_components/UserAvatar";
import { useSocketContext } from "@/app/_context/SocketContext";

function UserPanel() {
  const { data: session } = useSession();
  const { isConnected } = useSocketContext();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-2 border-t border-border bg-secondary/80 px-3 py-2">
      <UserAvatar
        userName={session.user.name}
        id={session.user.id}
        size={32}
        showStatus
        status={isConnected ? "ONLINE" : "OFFLINE"}
        statusBorderColor="border-secondary"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {session.user.name}
        </p>
        <p className="truncate text-[10px] text-gray-500">
          {isConnected ? "Online" : "Offline"}
        </p>
      </div>
    </div>
  );
}

export default UserPanel;
