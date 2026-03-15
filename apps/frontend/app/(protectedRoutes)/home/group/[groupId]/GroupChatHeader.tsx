"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { UserStatus } from "@repo/types";

type GroupChatHeaderProps = {
  group: {
    id: number;
    name: string;
    members: {
      id: string;
      userName: string | null;
      avatarConfig?: string | null;
      status: UserStatus;
    }[];
  };
};

function GroupChatHeader({ group }: GroupChatHeaderProps) {
  const onlineCount = group.members.filter((m) => m.status === "ONLINE").length;

  return (
    <div className="border-border flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-xs font-semibold text-gray-400">
          {group.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{group.name}</p>
          <p className="text-xs text-gray-500">
            {group.members.length} member{group.members.length !== 1 ? "s" : ""}
            {onlineCount > 0 && ` \u00b7 ${onlineCount} online`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          aria-label="Members"
          className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
        >
          <Icon icon="mdi:account-group" className="text-lg" />
        </button>
      </div>
    </div>
  );
}

export default GroupChatHeader;
