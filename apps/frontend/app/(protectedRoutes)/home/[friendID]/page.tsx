import ClientIcon from "@/app/_components/ClientIcon";
import { getChatPageData } from "@/app/_dataAccessLayer/userActions";
import Messages from "./Messages";
import ChatHeader from "./ChatHeader";

export const revalidate = 0;

type Params = {
  params: Promise<{
    friendID: string;
  }>;
};

async function Page({ params }: Params) {
  const { friendID } = await params;
  const result = await getChatPageData(friendID);

  if (!result || "error" in result) {
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

  const { session, friend, messages, currentUserAvatarConfig } = result;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <ChatHeader friend={friend} />

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <Messages friend={friend} session={session} messages={messages} currentUserAvatarConfig={currentUserAvatarConfig} />
      </div>
    </div>
  );
}

export default Page;
