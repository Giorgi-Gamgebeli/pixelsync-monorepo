import ClientIcon from "@/app/_components/ClientIcon";
import UserAvatar from "@/app/_components/UserAvatar";
import { getChatPageData } from "@/app/_dataAccessLayer/userActions";
import Messages from "./Messages";

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

  const { session, friend, messages } = result;
  const { status, userName } = friend;
  const isOnline = status === "ONLINE";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* Chat header */}
      <div className="border-border flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            userName={userName}
            id={friend.id}
            avatarConfig={friend.avatarConfig}
            size={32}
            showStatus
            status={status}
          />
          <div>
            <p className="text-sm font-medium text-white">{userName}</p>
            <p className="text-xs text-gray-500">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Call"
            className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
          >
            <ClientIcon icon="mdi:phone" className="text-lg" />
          </button>
          <button
            aria-label="More options"
            className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
          >
            <ClientIcon icon="mdi:dots-vertical" className="text-lg" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <Messages friend={friend} session={session} messages={messages} />
      </div>
    </div>
  );
}

export default Page;
