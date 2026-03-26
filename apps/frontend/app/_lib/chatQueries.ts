import { QueryClient, useQuery } from "@tanstack/react-query";
import { getChatPageData } from "../_dataAccessLayer/userActions";
import { getGroupChatPageData } from "../_dataAccessLayer/groupActions";
import type { DirectMessage, GroupMessage, UserStatus } from "@repo/types";
import type { Session } from "next-auth";

type DMChatPageData = {
  session: Session;
  friend: {
    id: string;
    userName: string | null;
    status: UserStatus;
    avatarConfig: string | null;
  };
  currentUserAvatarConfig: string | null;
  messages: DirectMessage[];
};

type GroupChatPageData = {
  session: Session;
  group: {
    id: number;
    name: string;
    ownerId: string;
    members: {
      id: string;
      userName: string | null;
      avatarConfig: string | null;
      status: UserStatus;
    }[];
  };
  currentUserAvatarConfig: string | null;
  messages: GroupMessage[];
};

type DMChatQueryKey = readonly ["dm-chat", string];
type GroupChatQueryKey = readonly ["group-chat", number];

const dmChatKey = (friendId: string): DMChatQueryKey =>
  ["dm-chat", friendId] as const;

const groupChatKey = (groupId: number): GroupChatQueryKey =>
  ["group-chat", groupId] as const;

async function fetchDMChatPageData(friendId: string): Promise<DMChatPageData> {
  const result = await getChatPageData(friendId);
  if (!result || "error" in result) {
    throw new Error(result?.error ?? "Failed to load chat");
  }
  return result as DMChatPageData;
}

async function fetchGroupChatPageData(
  groupId: number,
): Promise<GroupChatPageData> {
  const result = await getGroupChatPageData(groupId);
  if (!result || "error" in result) {
    throw new Error(result?.error ?? "Failed to load group chat");
  }
  return result as GroupChatPageData;
}

function getSharedQueryOptions() {
  return {
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false as const,
  };
}

function useDMChatQuery(friendId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: friendId ? dmChatKey(friendId) : ["dm-chat", "missing"],
    queryFn: () => fetchDMChatPageData(friendId as string),
    enabled: Boolean(friendId) && enabled,
    ...getSharedQueryOptions(),
  });
}

function useGroupChatQuery(groupId: number | undefined, enabled = true) {
  return useQuery({
    queryKey:
      typeof groupId === "number"
        ? groupChatKey(groupId)
        : ["group-chat", "missing"],
    queryFn: () => fetchGroupChatPageData(groupId as number),
    enabled: typeof groupId === "number" && enabled,
    ...getSharedQueryOptions(),
  });
}

function prefetchDMChat(queryClient: QueryClient, friendId: string) {
  return queryClient.prefetchQuery({
    queryKey: dmChatKey(friendId),
    queryFn: () => fetchDMChatPageData(friendId),
    ...getSharedQueryOptions(),
  });
}

function prefetchGroupChat(queryClient: QueryClient, groupId: number) {
  return queryClient.prefetchQuery({
    queryKey: groupChatKey(groupId),
    queryFn: () => fetchGroupChatPageData(groupId),
    ...getSharedQueryOptions(),
  });
}

function replaceDMChatMessages(
  queryClient: QueryClient,
  friendId: string,
  messages: DirectMessage[],
) {
  queryClient.setQueryData<DMChatPageData>(dmChatKey(friendId), (prev) =>
    prev ? { ...prev, messages } : prev,
  );
}

function replaceGroupChatMessages(
  queryClient: QueryClient,
  groupId: number,
  messages: GroupMessage[],
) {
  queryClient.setQueryData<GroupChatPageData>(groupChatKey(groupId), (prev) =>
    prev ? { ...prev, messages } : prev,
  );
}

function upsertDMChatMessage(
  queryClient: QueryClient,
  friendId: string,
  message: DirectMessage,
  currentUserId?: string,
) {
  queryClient.setQueryData<DMChatPageData>(dmChatKey(friendId), (prev) => {
    if (!prev) return prev;

    const messages = [...prev.messages];
    const byIdIndex = messages.findIndex((m) => m.id === message.id);
    if (byIdIndex !== -1) {
      messages[byIdIndex] = message;
      return { ...prev, messages };
    }

    if (currentUserId && message.senderId === currentUserId) {
      const optimisticIndex = messages.findIndex(
        (m) =>
          m.id < 0 &&
          m.content === message.content &&
          m.senderId === currentUserId,
      );
      if (optimisticIndex !== -1) {
        messages[optimisticIndex] = message;
        return { ...prev, messages };
      }
    }

    messages.push(message);
    return { ...prev, messages };
  });
}

function upsertGroupChatMessage(
  queryClient: QueryClient,
  groupId: number,
  message: GroupMessage,
  currentUserId?: string,
) {
  queryClient.setQueryData<GroupChatPageData>(groupChatKey(groupId), (prev) => {
    if (!prev) return prev;

    const messages = [...prev.messages];
    const byIdIndex = messages.findIndex((m) => m.id === message.id);
    if (byIdIndex !== -1) {
      messages[byIdIndex] = message;
      return { ...prev, messages };
    }

    if (currentUserId && message.senderId === currentUserId) {
      const optimisticIndex = messages.findIndex(
        (m) =>
          m.id < 0 &&
          m.content === message.content &&
          m.senderId === currentUserId,
      );
      if (optimisticIndex !== -1) {
        messages[optimisticIndex] = message;
        return { ...prev, messages };
      }
    }

    messages.push(message);
    return { ...prev, messages };
  });
}

export type {
  DMChatPageData,
  GroupChatPageData,
  DMChatQueryKey,
  GroupChatQueryKey,
};
export {
  dmChatKey,
  groupChatKey,
  useDMChatQuery,
  useGroupChatQuery,
  prefetchDMChat,
  prefetchGroupChat,
  replaceDMChatMessages,
  replaceGroupChatMessages,
  upsertDMChatMessage,
  upsertGroupChatMessage,
};
