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

const dmCache = new Map<string, DMCacheEntry>();
const groupCache = new Map<number, GroupCacheEntry>();

const dmFetching = new Map<string, Promise<DMCacheEntry | null>>();
const groupFetching = new Map<number, Promise<GroupCacheEntry | null>>();
const dmListeners = new Map<string, Set<() => void>>();

function notifyDMListeners(friendId: string): void {
  const listeners = dmListeners.get(friendId);
  if (!listeners) return;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeDMCache(
  friendId: string,
  listener: () => void,
): () => void {
  let listeners = dmListeners.get(friendId);
  if (!listeners) {
    listeners = new Set();
    dmListeners.set(friendId, listeners);
  }
  listeners.add(listener);

  return () => {
    listeners?.delete(listener);
    if (listeners && listeners.size === 0) {
      dmListeners.delete(friendId);
    }
  };
}

export function getDMCache(friendId: string): DMCacheEntry | undefined {
  return dmCache.get(friendId);
}

export function setDMCache(friendId: string, data: DMCacheEntry): void {
  dmCache.set(friendId, data);
  notifyDMListeners(friendId);
}

export function patchDMMessages(
  friendId: string,
  messages: DMCacheEntry["messages"],
): void {
  const entry = dmCache.get(friendId);
  if (entry) {
    entry.messages = messages;
    notifyDMListeners(friendId);
  }
}

export function upsertDMMessage(
  friendId: string,
  message: DMCacheEntry["messages"][number],
  currentUserId?: string,
): void {
  const entry = dmCache.get(friendId);
  if (!entry) return;

  const byIdIndex = entry.messages.findIndex((m) => m.id === message.id);
  if (byIdIndex !== -1) {
    entry.messages[byIdIndex] = message;
    notifyDMListeners(friendId);
    return;
  }

  if (currentUserId && message.senderId === currentUserId) {
    const optimisticIndex = entry.messages.findIndex(
      (m) =>
        m.id < 0 &&
        m.content === message.content &&
        m.senderId === currentUserId,
    );
    if (optimisticIndex !== -1) {
      entry.messages[optimisticIndex] = message;
      notifyDMListeners(friendId);
      return;
    }
  }

  entry.messages.push(message);
  notifyDMListeners(friendId);
}

export function fetchDM(friendId: string): Promise<DMCacheEntry | null> {
  const cached = dmCache.get(friendId);
  if (cached) {
    console.log("[dm client cache hit]", friendId);
    return Promise.resolve(cached);
  }

  const existing = dmFetching.get(friendId);
  if (existing) return existing;

  console.log("[dm client cache miss]", friendId);
  const promise = getChatPageData(friendId).then((result) => {
    dmFetching.delete(friendId);
    if (result && !("error" in result)) {
      dmCache.set(friendId, result);
      notifyDMListeners(friendId);
      return result;
    }
    return null;
  });

  dmFetching.set(friendId, promise);
  return promise;
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

export function fetchGroup(groupId: number): Promise<GroupCacheEntry | null> {
  const cached = groupCache.get(groupId);
  if (cached) {
    return Promise.resolve(cached);
  }

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

if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  const dm = params.get("dm");
  const group = params.get("group");
  if (dm) fetchDM(dm);
  if (group) fetchGroup(Number(group));
}
