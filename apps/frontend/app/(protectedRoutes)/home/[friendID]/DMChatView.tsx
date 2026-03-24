"use client";

import type { Session } from "next-auth";
import ChatHeader from "./ChatHeader";
import Messages from "./Messages";
import ClientIcon from "@/app/_components/ClientIcon";
import type { DMChatPageData } from "./getCachedDMChatPageData";

type DMChatViewProps = Readonly<{
  friendId: string;
  session: Session;
  initialData: DMChatPageData | { error: string };
}>;

function DMChatView({ friendId, session, initialData }: DMChatViewProps) {
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
