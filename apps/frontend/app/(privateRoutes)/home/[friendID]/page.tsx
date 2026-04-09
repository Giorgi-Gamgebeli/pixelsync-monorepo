"use client";

import ClientIcon from "@/app/_components/ClientIcon";
import {
  getChatPageData,
  getFriendsPageData,
} from "@/app/_dataAccessLayer/userActions";
import { useQuery } from "@/app/_hooks/useQuery";
import { dmChatKey } from "@/app/_lib/chatQueryKeys";
import { friendsPageKey } from "@/app/_lib/friendsQueryKeys";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import ChatHeader from "./ChatHeader";
import ChatSkeleton from "../../../_components/skeletons/ChatSkeleton";
import Messages from "../../../_components/Messages";

function Page() {
  const params = useParams<{ friendID: string }>();
  const friendID = params.friendID;
  const { data: session } = useSession();
  const {
    data: chatData,
    error: chatError,
    isPending: isChatPending,
  } = useQuery({
    queryKey: dmChatKey(friendID),
    queryFn: () => getChatPageData(friendID),
  });
  const {
    data: friendsData,
    error: friendsError,
    isPending: isFriendsPending,
  } = useQuery({
    queryKey: friendsPageKey,
    queryFn: getFriendsPageData,
  });

  if (
    !session ||
    (isChatPending && !chatData) ||
    (isFriendsPending && !friendsData)
  ) {
    return <ChatSkeleton />;
  }

  const friend =
    !friendsData || "error" in friendsData
      ? undefined
      : friendsData.friends.find((item) => item.id === friendID);

  if (
    chatError ||
    friendsError ||
    !chatData ||
    !friendsData ||
    "error" in chatData ||
    "error" in friendsData ||
    !friend
  ) {
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
      <ChatHeader friend={friend} />

      <div className="flex-1 overflow-hidden">
        <Messages
          key={friendID}
          mode="dm"
          friend={friend}
          session={session}
          messages={chatData.messages}
          currentUserAvatarConfig={session.user.avatarConfig}
        />
      </div>
    </div>
  );
}

export default Page;
