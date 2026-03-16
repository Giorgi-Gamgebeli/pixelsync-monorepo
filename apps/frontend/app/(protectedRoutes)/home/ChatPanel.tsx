"use client";

import { useChatRouter } from "./ChatRouterContext";
import DMChatView from "./[friendID]/DMChatView";
import GroupChatView from "./group/[groupId]/GroupChatView";

function ChatPanel({ children }: { children: React.ReactNode }) {
  const { activeView } = useChatRouter();

  if (activeView?.type === "dm") {
    return <DMChatView friendId={activeView.friendId} />;
  }
  if (activeView?.type === "group") {
    return <GroupChatView groupId={activeView.groupId} />;
  }

  return <>{children}</>;
}

export default ChatPanel;
