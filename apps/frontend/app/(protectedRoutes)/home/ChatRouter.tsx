"use client";

import { useChatRouter } from "./ChatRouterContext";
import DMChatView from "./[friendID]/DMChatView";
import GroupChatView from "./group/[groupId]/GroupChatView";

function ChatRouter({ children }: { children: React.ReactNode }) {
  const { selectedChat } = useChatRouter();

  if (selectedChat?.type === "dm") {
    return <DMChatView friendId={selectedChat.friendId} />;
  }

  if (selectedChat?.type === "group") {
    return <GroupChatView groupId={selectedChat.groupId} />;
  }

  return <>{children}</>;
}

export default ChatRouter;
