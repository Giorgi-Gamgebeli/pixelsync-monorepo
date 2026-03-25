import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ChatHeader from "./ChatHeader";
import Messages from "./Messages";
import { getCachedDMChatPageData } from "./getCachedDMChatPageData";

type Params = Readonly<{
  params: Promise<{
    friendID: string;
  }>;
}>;

export default async function Page({ params }: Params) {
  const { friendID } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const data = await getCachedDMChatPageData(friendID, session.user.id);

  if (!data || "error" in data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="text-sm font-medium text-white">Friend not found</p>
        <p className="text-sm text-gray-500">
          This chat is unavailable or you are no longer friends with this user.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <ChatHeader friend={data.friend} />

      <div className="flex-1 overflow-hidden">
        <Messages
          key={friendID}
          mode="dm"
          friend={data.friend}
          session={session}
          messages={data.messages}
          currentUserAvatarConfig={session.user.avatarConfig}
        />
      </div>
    </div>
  );
}
