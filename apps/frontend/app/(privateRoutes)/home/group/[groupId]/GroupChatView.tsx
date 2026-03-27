"use client";

import GroupChatHeader from "./GroupChatHeader";
import GroupCallBanner from "./GroupCallBanner";
import Messages from "../../[friendID]/Messages";
import ChatSkeleton from "../../[friendID]/ChatSkeleton";
import ClientIcon from "@/app/_components/ClientIcon";
import { useGroupChatQuery } from "@/app/_lib/chatQueries";

function GroupChatView({ groupId }: { groupId: number }) {
  const { data, error, isPending } = useGroupChatQuery(groupId);

  if (isPending && !data) return <ChatSkeleton />;

  if (error || !data || "error" in data) {
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
