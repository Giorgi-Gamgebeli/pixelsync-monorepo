import { QueryClient } from "@tanstack/react-query";
import type { DirectMessage, GroupMessage } from "@repo/types";
import { dmChatKey, groupChatKey } from "./chatQueryKeys";
import type { DMChatPageData, GroupChatPageData } from "./chatQueryTypes";

function upsertDMChatMessage(
  queryClient: QueryClient,
  friendId: string,
  message: DirectMessage,
) {
  queryClient.setQueryData<DMChatPageData>(dmChatKey(friendId), (prev) => {
    if (!prev) return prev;

    const messages = [...prev.messages];
    const byIdIndex = messages.findIndex((m) => m.id === message.id);
    if (byIdIndex !== -1) {
      messages[byIdIndex] = message;
      return { ...prev, messages };
    }

    messages.push(message);
    return { ...prev, messages };
  });
}

function upsertGroupChatMessage(
  queryClient: QueryClient,
  groupId: number,
  message: GroupMessage,
) {
  queryClient.setQueryData<GroupChatPageData>(groupChatKey(groupId), (prev) => {
    if (!prev) return prev;

    const messages = [...prev.messages];
    const byIdIndex = messages.findIndex((m) => m.id === message.id);
    if (byIdIndex !== -1) {
      messages[byIdIndex] = message;
      return { ...prev, messages };
    }

    messages.push(message);
    return { ...prev, messages };
  });
}

export { upsertDMChatMessage, upsertGroupChatMessage };
