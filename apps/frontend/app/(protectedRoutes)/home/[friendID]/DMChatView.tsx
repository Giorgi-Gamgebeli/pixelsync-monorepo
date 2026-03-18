"use client";

import { useEffect, useState } from "react";
import { getDMCache, fetchDM, type DMCacheEntry } from "@/app/_lib/chatCache";
import ChatHeader from "./ChatHeader";
import Messages from "./Messages";
import ChatSkeleton from "./ChatSkeleton";
import ClientIcon from "@/app/_components/ClientIcon";

function DMChatView({ friendId }: { friendId: string }) {
  const cached = getDMCache(friendId);
  const [data, setData] = useState<DMCacheEntry | null>(cached ?? null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let stale = false;

    fetchDM(friendId).then((result) => {
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
  }, [friendId]);

  if (loading) return <ChatSkeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="bg-surface mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <ClientIcon
            icon="mdi:account-off"
            className="text-3xl text-gray-500"
          />
        </div>
        <p className="text-sm font-medium text-white">Friend not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <ChatHeader friend={data.friend} />

      <div className="flex-1 overflow-hidden">
        <Messages
          key={friendId}
          mode="dm"
          friend={data.friend}
          session={data.session}
          messages={data.messages}
          currentUserAvatarConfig={data.currentUserAvatarConfig}
        />
      </div>
    </div>
  );
}

export default DMChatView;
