import type { getChatPageData } from "../_dataAccessLayer/userActions";
import type { getGroupChatPageData } from "../_dataAccessLayer/groupActions";

export type DMCacheEntry = Exclude<
  Awaited<ReturnType<typeof getChatPageData>>,
  { error: string } | undefined
>;

export type GroupCacheEntry = Exclude<
  Awaited<ReturnType<typeof getGroupChatPageData>>,
  { error: string } | undefined
>;

// Module-level Maps — persist across navigations since the module stays loaded
const dmCache = new Map<string, DMCacheEntry>();
const groupCache = new Map<number, GroupCacheEntry>();

export function getDMCache(friendId: string): DMCacheEntry | undefined {
  return dmCache.get(friendId);
}

export function setDMCache(friendId: string, data: DMCacheEntry): void {
  dmCache.set(friendId, data);
}

export function patchDMMessages(
  friendId: string,
  messages: DMCacheEntry["messages"],
): void {
  const entry = dmCache.get(friendId);
  if (entry) {
    entry.messages = messages;
  }
}

export function getGroupCache(groupId: number): GroupCacheEntry | undefined {
  return groupCache.get(groupId);
}

export function setGroupCache(groupId: number, data: GroupCacheEntry): void {
  groupCache.set(groupId, data);
}

export function patchGroupMessages(
  groupId: number,
  messages: GroupCacheEntry["messages"],
): void {
  const entry = groupCache.get(groupId);
  if (entry) {
    entry.messages = messages;
  }
}
