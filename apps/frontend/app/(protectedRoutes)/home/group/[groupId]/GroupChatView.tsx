"use client";

import { useEffect, useState } from "react";
import {
  getGroupCache,
  fetchGroup,
  type GroupCacheEntry,
} from "@/app/_lib/chatCache";
import GroupChatHeader from "./GroupChatHeader";
import GroupCallBanner from "./GroupCallBanner";
import Messages from "../../[friendID]/Messages";
import ChatSkeleton from "../../[friendID]/ChatSkeleton";
import ClientIcon from "@/app/_components/ClientIcon";

function GroupChatView({ groupId }: { groupId: number }) {
  const cached = getGroupCache(groupId);
  const [data, setData] = useState<GroupCacheEntry | null>(cached ?? null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let stale = false;

    fetchGroup(groupId).then((result) => {
      if (stale) return;
      if (result) {
        setData(result);
      } else {
        setData((prev) => {
          if (!prev) setError(true);
          return prev;
        });
      }
      setLoading(false);
    });

    return () => {
      stale = true;
    };
  }, [groupId]);

  if (loading) return <ChatSkeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="bg-surface mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <ClientIcon
            icon="mdi:account-group-outline"
            className="text-3xl text-gray-500"
          />
        </div>
        <p className="text-sm font-medium text-white">Group not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <GroupChatHeader group={data.group} />
      <GroupCallBanner groupId={data.group.id} groupName={data.group.name} />

      <div className="flex-1 overflow-hidden">
        <Messages
          key={groupId}
          mode="group"
          group={data.group}
          session={data.session}
          messages={data.messages}
          currentUserAvatarConfig={data.currentUserAvatarConfig}
        />
      </div>
    </div>
  );
}

export default GroupChatView;
