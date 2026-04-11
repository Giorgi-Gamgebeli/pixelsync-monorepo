import { dmChatKey } from "@/app/_lib/chatQueryKeys";
import { FriendsPageData } from "@/app/_lib/friendsQueryCache";
import {
  sortFriendsByLastMessageAt,
  toTimestamp,
} from "@/app/_lib/friendsSorting";
import {
  ClientToServerEvents,
  DirectMessage,
  ServerToClientEvents,
} from "@repo/types";
import { QueryClient } from "@tanstack/react-query";
import { RefObject } from "react";
import { Socket } from "socket.io-client";
import { friendsPageKey } from "./cacheKeys";

type SendMessageActionTypes = {
  optimisticMessage: DirectMessage;
  queryClient: QueryClient;
  currentUserIdRef: RefObject<string | null>;
  socketRef: RefObject<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>;
};

export function sendMessageAction({
  optimisticMessage,
  queryClient,
  currentUserIdRef,
  socketRef,
}: SendMessageActionTypes) {
  const { receiverId, id, content } = optimisticMessage;
  const queryKey = ["dm-chat", receiverId];

  queryClient.setQueryData(queryKey, (prev: { messages: DirectMessage[] }) => {
    if (!prev) return prev;

    const messages = [...prev.messages];
    const byIdIndex = messages.findIndex((m) => m.id === optimisticMessage.id);
    if (byIdIndex !== -1) {
      messages[byIdIndex] = optimisticMessage;
      return { ...prev, messages };
    }

    messages.push(optimisticMessage);
    return { ...prev, messages };
  });

  const currentUserId = currentUserIdRef.current;
  if (!currentUserId) return;

  socketRef.current?.emit(
    "dm:send",
    {
      id,
      receiverId,
      content,
      senderId: currentUserId,
    },
    (response) => {
      if (response.success) return;

      queryClient.invalidateQueries({ queryKey: dmChatKey(receiverId) });
    },
  );

  setTypingAction({ socketRef, receiverId, isTyping: false });
}

type setTypingAction = {
  receiverId: string;
  isTyping: boolean;
  socketRef: RefObject<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>;
};

export function setTypingAction({
  socketRef,
  receiverId,
  isTyping,
}: setTypingAction) {
  socketRef.current?.emit("dm:typing", { receiverId, isTyping });
}

type HandleDmReceiveActionTypes = {
  currentUserIdRef: RefObject<string | null>;
  queryClient: QueryClient;
  message: Parameters<ServerToClientEvents["dm:receive"]>[0];
  notificationSound: RefObject<HTMLAudioElement | null>;
};

export function handleDMReceiveAction({
  currentUserIdRef,
  queryClient,
  message,
  notificationSound,
}: HandleDmReceiveActionTypes) {
  const currentUserId = currentUserIdRef.current;
  const otherUserId =
    message.senderId === currentUserId ? message.receiverId : message.senderId;

  queryClient.setQueryData(
    dmChatKey(otherUserId),
    (prev: { messages: DirectMessage[] }) => {
      if (!prev) return prev;

      const messages = [...prev.messages];
      const byIdIndex = messages.findIndex((m) => m.id === message.id);
      if (byIdIndex !== -1) {
        messages[byIdIndex] = message;
        return { ...prev, messages };
      }

      messages.push(message);
      return { ...prev, messages };
    },
  );

  const lastMessageAt = message.createdAt;
  const incomingTimestamp = toTimestamp(lastMessageAt);
  if (!incomingTimestamp) return;

  queryClient.setQueryData<FriendsPageData>(friendsPageKey, (prev) => {
    if (!prev) return prev;

    let changed = false;
    const friends = prev.friends.map((friend) => {
      if (friend.id !== otherUserId) return friend;

      if (incomingTimestamp <= toTimestamp(friend.lastMessageAt ?? null)) {
        return friend;
      }

      changed = true;
      return {
        ...friend,
        lastMessageAt,
      };
    });

    if (!changed) return prev;

    return {
      ...prev,
      friends: sortFriendsByLastMessageAt(friends),
    };
  });

  if (message.senderId !== currentUserId) {
    notificationSound.current?.play().catch(() => {});
  }
}
