import type { QueryClient } from "@tanstack/react-query";
import type { DirectMessage, GroupMessage, UserStatus } from "@repo/types";
import { v7 as uuidv7 } from "uuid";
import { setChatMessage } from "./chatQueryCache";
import { dmChatKey, groupChatKey } from "./chatQueryKeys";
import type { DMChatPageData, GroupChatPageData } from "./chatQueryTypes";

type ChatFriend = {
  id: string;
  status: UserStatus;
  userName: string | null;
  avatarConfig?: string | null;
} | null;

type ChatGroup = {
  id: number;
  name: string;
  members: Array<{
    id: string;
    userName: string | null;
    avatarConfig?: string | null;
    status: UserStatus;
  }>;
} | null;

type ChatMessage = DirectMessage | GroupMessage;

const GROUPING_WINDOW_MS = 5 * 60 * 1000;

function shouldGroupMessage(
  current: ChatMessage,
  previous: ChatMessage | undefined,
): boolean {
  if (!previous) return false;
  if (current.senderId !== previous.senderId) return false;
  return (
    new Date(current.createdAt).getTime() -
      new Date(previous.createdAt).getTime() <
    GROUPING_WINDOW_MS
  );
}

function getSenderName({
  senderId,
  sessionUserId,
  friend,
  group,
  messages,
}: {
  senderId: string;
  sessionUserId: string;
  friend: ChatFriend;
  group: ChatGroup;
  messages: ChatMessage[];
}): string {
  if (senderId === sessionUserId) return "You";
  if (friend) return friend.userName || "Friend";
  if (group) {
    const member = group.members.find((m) => m.id === senderId);
    return (
      member?.userName ??
      messages.find((m) => m.senderId === senderId && "sender" in m)?.sender
        ?.userName ??
      "Unknown"
    );
  }
  return "Unknown";
}

function getSenderAvatar({
  senderId,
  sessionUserId,
  friend,
  group,
  currentUserAvatarConfig,
  message,
}: {
  senderId: string;
  sessionUserId: string;
  friend: ChatFriend;
  group: ChatGroup;
  currentUserAvatarConfig?: string | null;
  message: ChatMessage;
}): string | null | undefined {
  if (senderId === sessionUserId) return currentUserAvatarConfig;
  if (friend) return friend.avatarConfig;
  if (group) {
    const member = group.members.find((m) => m.id === senderId);
    const sender = "sender" in message ? message.sender : undefined;
    return (
      member?.avatarConfig ??
      (sender && "avatarConfig" in sender ? sender.avatarConfig : undefined)
    );
  }
  return undefined;
}

function getTypingText({
  friend,
  isFriendTyping,
  group,
  typingUsers,
}: {
  friend: ChatFriend;
  isFriendTyping: boolean;
  group: ChatGroup;
  typingUsers: Record<string, boolean>;
}): string {
  if (friend && isFriendTyping) {
    return `${friend.userName} is typing...`;
  }

  if (!group) return "";

  const typingNames = Object.entries(typingUsers)
    .filter(([, t]) => t)
    .map(([userId]) => {
      const member = group.members.find((m) => m.id === userId);
      return member?.userName || "Someone";
    });

  if (typingNames.length === 1) {
    return `${typingNames[0]} is typing...`;
  }
  if (typingNames.length === 2) {
    return `${typingNames[0]} and ${typingNames[1]} are typing...`;
  }
  if (typingNames.length > 2) {
    return `${typingNames[0]} and ${typingNames.length - 1} others are typing...`;
  }

  return "";
}

function getPlaceholder(friend: ChatFriend, group: ChatGroup) {
  return friend
    ? `Message @${friend.userName || "friend"}`
    : `Message ${group?.name}`;
}

function getEmptyLabel(friend: ChatFriend, group: ChatGroup) {
  return friend ? friend.userName || "your friend" : group?.name || "the group";
}

function submitMessage({
  text,
  friend,
  group,
  sessionUserId,
  sessionUserName,
  currentUserAvatarConfig,
  queryClient,
  sendMessage,
  setTyping,
  sendGroupMessage,
  setGroupTyping,
}: {
  text: string;
  friend: ChatFriend;
  group: ChatGroup;
  sessionUserId: string;
  sessionUserName: string | null | undefined;
  currentUserAvatarConfig?: string | null;
  queryClient: QueryClient;
  sendMessage: (receiverId: string, content: string, id: string) => void;
  setTyping: (receiverId: string, isTyping: boolean) => void;
  sendGroupMessage: (groupId: number, content: string, id: string) => void;
  setGroupTyping: (groupId: number, isTyping: boolean) => void;
}) {
  const messageId = uuidv7();

  if (friend) {
    const optimisticMessage: DirectMessage = {
      id: messageId,
      content: text,
      senderId: sessionUserId,
      receiverId: friend.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pending: true,
    };
    setChatMessage<DMChatPageData>(
      queryClient,
      dmChatKey(friend.id),
      optimisticMessage,
    );
    sendMessage(friend.id, text, messageId);
    setTyping(friend.id, false);
  }

  if (group) {
    const optimisticMessage: GroupMessage = {
      id: messageId,
      content: text,
      senderId: sessionUserId,
      groupId: group.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      pending: true,
      sender: {
        userName:
          group.members.find((member) => member.id === sessionUserId)
            ?.userName ??
          sessionUserName ??
          null,
        avatarConfig: currentUserAvatarConfig,
      },
    };
    setChatMessage<GroupChatPageData>(
      queryClient,
      groupChatKey(group.id),
      optimisticMessage,
    );
    sendGroupMessage(group.id, text, messageId);
    setGroupTyping(group.id, false);
  }
}

export {
  getEmptyLabel,
  getPlaceholder,
  getSenderAvatar,
  getSenderName,
  getTypingText,
  shouldGroupMessage,
  submitMessage,
};
