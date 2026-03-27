"use client";

import { QueryClient, useQuery } from "@tanstack/react-query";
import { getChatPageData } from "../_dataAccessLayer/userActions";
import { getGroupChatPageData } from "../_dataAccessLayer/groupActions";
import { dmChatKey, groupChatKey } from "./chatQueryKeys";
import type { DMChatPageData, GroupChatPageData } from "./chatQueryTypes";

async function fetchDMChatPageData(friendId: string): Promise<DMChatPageData> {
  const result = await getChatPageData(friendId);

  if (!result || "error" in result) {
    throw new Error(result?.error ?? "Failed to load chat");
  }

  return result;
}

async function fetchGroupChatPageData(
  groupId: number,
): Promise<GroupChatPageData> {
  const result = await getGroupChatPageData(groupId);

  if (!result || "error" in result) {
    throw new Error(result?.error ?? "Failed to load group chat");
  }

  return result;
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

function useDMChatQuery(friendId: string, enabled = true) {
  return useQuery({
    queryKey: dmChatKey(friendId),
    queryFn: () => fetchDMChatPageData(friendId),
    enabled: Boolean(friendId) && enabled,
    ...getSharedQueryOptions(),
  });
}

function useGroupChatQuery(groupId: number, enabled = true) {
  return useQuery({
    queryKey: groupChatKey(groupId),
    queryFn: () => fetchGroupChatPageData(groupId),
    enabled: enabled,
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

export {
  getSharedQueryOptions,
  useDMChatQuery,
  useGroupChatQuery,
  prefetchDMChat,
  prefetchGroupChat,
};
