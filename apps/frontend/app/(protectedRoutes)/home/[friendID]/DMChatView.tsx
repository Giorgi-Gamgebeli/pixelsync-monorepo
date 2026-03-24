"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ChatHeader from "./ChatHeader";
import Messages from "./Messages";
import ClientIcon from "@/app/_components/ClientIcon";
import { fetchDM, getDMCache, type DMCacheEntry } from "@/app/_lib/chatCache";

type DMChatViewProps = Readonly<{
  friendId: string;
}>;

function DMChatView({ friendId }: DMChatViewProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [initialData, setInitialData] = useState<DMCacheEntry | null>(
    () => getDMCache(friendId) ?? null,
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    const cached = getDMCache(friendId);

    if (cached) {
      setInitialData(cached);
      return;
    }

    setInitialData(null);

    fetchDM(friendId).then((data) => {
      if (!cancelled) {
        setInitialData(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [friendId, status]);

  if (status === "loading" || !session?.user?.id) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">Loading chat...</p>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">Loading chat...</p>
      </div>
    );
  }

  if ("error" in initialData) {
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

  const currentUserAvatarConfig = session.user.avatarConfig ?? null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <ChatHeader friend={initialData.friend} />

      <div className="flex-1 overflow-hidden">
        <Messages
          key={friendId}
          mode="dm"
          friend={initialData.friend}
          session={session}
          messages={initialData.messages}
          currentUserAvatarConfig={currentUserAvatarConfig}
        />
      </div>
    </div>
  );
}

export default DMChatView;
