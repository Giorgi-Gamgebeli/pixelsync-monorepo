import type { DMChatQueryKey, GroupChatQueryKey } from "./chatQueryTypes";

const dmChatKey = (friendId: string): DMChatQueryKey =>
  ["dm-chat", friendId] as const;

const groupChatKey = (groupId: number): GroupChatQueryKey =>
  ["group-chat", groupId] as const;

export { dmChatKey, groupChatKey };
