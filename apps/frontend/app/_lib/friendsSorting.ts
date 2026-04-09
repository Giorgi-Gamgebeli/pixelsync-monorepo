type FriendWithLastMessage = {
  id: string;
  userName: string | null;
  lastMessageAt?: string | null;
};

function toTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortFriendsByLastMessageAt<T extends FriendWithLastMessage>(
  friends: T[],
) {
  return [...friends].sort((a, b) => {
    const delta = toTimestamp(b.lastMessageAt) - toTimestamp(a.lastMessageAt);
    if (delta !== 0) return delta;

    const aUserName = a.userName ?? "";
    const bUserName = b.userName ?? "";
    if (aUserName !== bUserName) {
      return aUserName.localeCompare(bUserName);
    }

    return a.id.localeCompare(b.id);
  });
}

export { sortFriendsByLastMessageAt, toTimestamp };
