"use client";

import ClientIcon from "@/app/_components/ClientIcon";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatHeader from "./ChatHeader";
import Messages from "./Messages";
import ChatSkeleton from "./ChatSkeleton";
import { useDMChatQuery } from "@/app/_lib/chatQueries";

function Page() {
  const router = useRouter();
  const params = useParams<{ friendID: string }>();
  const friendID = params?.friendID;
  const { status } = useSession();
  const { data, error, isPending } = useDMChatQuery(
    friendID,
    status === "authenticated",
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (
    status === "loading" ||
    (status === "authenticated" && isPending && !data)
  ) {
    return <ChatSkeleton />;
  }

  if (error || !data || "error" in data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <div className="bg-surface flex h-14 w-14 items-center justify-center rounded-2xl">
          <ClientIcon
            icon="mdi:account-question"
            className="text-3xl text-gray-500"
          />
        </div>
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
          session={data.session}
          messages={data.messages}
          currentUserAvatarConfig={data.currentUserAvatarConfig}
        />
      </div>
    </div>
  );
}

export default Page;
