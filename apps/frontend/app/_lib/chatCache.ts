import { getChatPageData } from "../_dataAccessLayer/userActions";
import { getGroupChatPageData } from "../_dataAccessLayer/groupActions";

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

// In-flight fetch promises — prevents duplicate requests
const dmFetching = new Map<string, Promise<DMCacheEntry | null>>();
const groupFetching = new Map<number, Promise<GroupCacheEntry | null>>();

// --- DM ---

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

export function fetchDM(friendId: string): Promise<DMCacheEntry | null> {
  const existing = dmFetching.get(friendId);
  if (existing) return existing;

  const promise = getChatPageData(friendId).then((result) => {
    dmFetching.delete(friendId);
    if (result && !("error" in result)) {
      dmCache.set(friendId, result);
      return result;
    }
    return null;
  });

  dmFetching.set(friendId, promise);
  return promise;
}

// --- Group ---

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

export function fetchGroup(groupId: number): Promise<GroupCacheEntry | null> {
  const existing = groupFetching.get(groupId);
  if (existing) return existing;

  const promise = getGroupChatPageData(groupId).then((result) => {
    groupFetching.delete(groupId);
    if (result && !("error" in result)) {
      groupCache.set(groupId, result);
      return result;
    }
    return null;
  });

  groupFetching.set(groupId, promise);
  return promise;
}

// Prefetch from URL on module load — runs before any component mounts
if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  const dm = params.get("dm");
  const group = params.get("group");
  if (dm) fetchDM(dm);
  else if (group) fetchGroup(Number(group));
}
