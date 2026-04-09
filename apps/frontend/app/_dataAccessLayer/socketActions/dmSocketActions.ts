import { dmChatKey } from "@/app/_lib/chatQueryKeys";
import {
  ClientToServerEvents,
  DirectMessage,
  ServerToClientEvents,
} from "@repo/types";
import { QueryClient } from "@tanstack/react-query";
import { RefObject } from "react";
import { Socket } from "socket.io-client";

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

  setTypingAction(receiverId, false);
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
