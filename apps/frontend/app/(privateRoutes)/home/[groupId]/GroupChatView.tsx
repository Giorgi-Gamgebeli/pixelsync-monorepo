"use client";

import ClientIcon from "@/app/_components/ClientIcon";
import { getGroupChatPageData } from "@/app/_dataAccessLayer/groupActions";
import { useQuery } from "@/app/_hooks/useQuery";
import { groupChatKey } from "@/app/_lib/chatQueryKeys";
import ChatSkeleton from "../../../_components/skeletons/ChatSkeleton";
import Messages from "../../../_components/Messages";
import GroupCallBanner from "./GroupCallBanner";
import GroupChatHeader from "./GroupChatHeader";
import { useParams } from "next/navigation";

function GroupChatView() {
  const params = useParams<{ groupId: string }>();
  const groupId = Number(params.groupId);

  const { data, error, isPending } = useQuery({
    queryKey: groupChatKey(groupId),
    queryFn: () => getGroupChatPageData(groupId),
  });

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
