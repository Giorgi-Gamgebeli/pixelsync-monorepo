export const friendsPageKey = ["friends-page"] as const;
export const pendingFriendRequestsKey = ["pending-friend-requests"] as const;

export const dmChatKey = (friendId: string) => ["dm-chat", friendId] as const;
export const groupChatKey = (groupId: number) =>
  ["group-chat", String(groupId)] as const;
