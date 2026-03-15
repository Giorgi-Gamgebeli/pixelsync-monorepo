import ClientIcon from "@/app/_components/ClientIcon";
import { getGroupChatPageData } from "@/app/_dataAccessLayer/groupActions";
import Messages from "../../[friendID]/Messages";
import GroupChatHeader from "./GroupChatHeader";

export const revalidate = 0;

type Params = {
  params: Promise<{
    groupId: string;
  }>;
};

async function Page({ params }: Params) {
  const { groupId } = await params;
  const result = await getGroupChatPageData(Number(groupId));

  if (!result || "error" in result) {
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

  const { session, group, messages, currentUserAvatarConfig } = result;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <GroupChatHeader group={group} />

      <div className="flex-1 overflow-hidden">
        <Messages
          mode="group"
          group={group}
          session={session}
          messages={messages}
          currentUserAvatarConfig={currentUserAvatarConfig}
        />
      </div>
    </div>
  );
}

export default Page;
