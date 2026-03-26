"use client";

import { useQueryClient } from "@tanstack/react-query";
import { UserStatus, DirectMessage, GroupMessage } from "@repo/types";
import { Session } from "next-auth";
import Message from "./Message";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useSocketContext } from "@/app/_context/SocketContext";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  replaceDMChatMessages,
  replaceGroupChatMessages,
} from "@/app/_lib/chatQueries";

const GROUPING_WINDOW_MS = 5 * 60 * 1000;

type ChatMessage = DirectMessage | GroupMessage;

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

type Member = {
  id: string;
  userName: string | null;
  avatarConfig?: string | null;
  status: UserStatus;
};

type DMProps = {
  mode: "dm";
  messages: DirectMessage[];
  session: Session;
  currentUserAvatarConfig?: string | null;
  friend: {
    id: string;
    status: UserStatus;
    userName: string | null;
    avatarConfig?: string | null;
  };
};

type GroupProps = {
  mode: "group";
  messages: GroupMessage[];
  session: Session;
  currentUserAvatarConfig?: string | null;
  group: {
    id: number;
    name: string;
    members: Member[];
  };
};

type MessagesProps = DMProps | GroupProps;

function Messages(props: MessagesProps) {
  const { messages, session, currentUserAvatarConfig, mode } = props;
  const friend = mode === "dm" ? props.friend : null;
  const group = mode === "group" ? props.group : null;
  const friendId = friend?.id ?? null;
  const groupId = group?.id ?? null;

  const queryClient = useQueryClient();
  const {
    socket,
    isConnected,
    sendMessage,
    setTyping,
    markAsRead,
    readAckSet,
    sendGroupMessage,
    setGroupTyping,
  } = useSocketContext();

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(messages);
  const [inputValue, setInputValue] = useState("");
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(localMessages);
  messagesRef.current = localMessages;

  useEffect(() => {
    setLocalMessages(messages || []);
  }, [messages]);

  useEffect(() => {
    if (friendId) markAsRead(friendId);
  }, [friendId, markAsRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [localMessages, isFriendTyping, typingUsers]);

  const persistMessages = useCallback(
    (nextMessages: ChatMessage[]) => {
      if (friendId) {
        replaceDMChatMessages(
          queryClient,
          friendId,
          nextMessages as DirectMessage[],
        );
        return;
      }

      if (groupId) {
        replaceGroupChatMessages(
          queryClient,
          groupId,
          nextMessages as GroupMessage[],
        );
      }
    },
    [friendId, groupId, queryClient],
  );

  // Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    if (friendId) {
      const onTyping = (data: { userId: string; isTyping: boolean }) => {
        if (data.userId === friendId) {
          setIsFriendTyping(data.isTyping);
        }
      };

      socket.on("dm:typing", onTyping);
      return () => {
        socket.off("dm:typing", onTyping);
      };
    }

    if (groupId) {
      const onReceive = (message: GroupMessage) => {
        if (message.groupId !== groupId) return;

        const nextMessages = (() => {
          const prev = messagesRef.current;
          if (message.senderId === session.user.id) {
            const pendingIndex = prev.findIndex(
              (m) => m.id < 0 && m.content === message.content,
            );
            if (pendingIndex !== -1) {
              const updated = [...prev];
              updated[pendingIndex] = message;
              return updated;
            }
          }
          return [...prev, message];
        })();

        setLocalMessages(nextMessages);
        persistMessages(nextMessages);
      };

      const onTyping = (data: {
        groupId: number;
        userId: string;
        isTyping: boolean;
      }) => {
        if (data.groupId !== groupId) return;
        if (data.userId === session.user.id) return;
        setTypingUsers((prev) => ({ ...prev, [data.userId]: data.isTyping }));
      };

      socket.on("group:receive", onReceive);
      socket.on("group:typing", onTyping);
      return () => {
        socket.off("group:receive", onReceive);
        socket.off("group:typing", onTyping);
      };
    }
  }, [
    isConnected,
    socket,
    session.user.id,
    friendId,
    groupId,
    persistMessages,
  ]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const optimisticId = -Date.now();

    if (friend) {
      const previousMessages = messagesRef.current as DirectMessage[];
      const nextMessages: DirectMessage[] = [
        ...previousMessages,
        {
          id: optimisticId,
          content: text,
          senderId: session.user.id,
          receiverId: friend.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isRead: false,
        },
      ];
      setLocalMessages(nextMessages);
      persistMessages(nextMessages);
      sendMessage(friend.id, text);
      setTyping(friend.id, false);
    }

    if (group) {
      const previousMessages = messagesRef.current as GroupMessage[];
      const nextMessages: GroupMessage[] = [
        ...previousMessages,
        {
          id: optimisticId,
          content: text,
          senderId: session.user.id,
          groupId: group.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isEdited: false,
          sender: {
            userName: session.user.userName ?? null,
            avatarConfig: currentUserAvatarConfig,
          },
        },
      ];
      setLocalMessages(nextMessages);
      persistMessages(nextMessages);
      sendGroupMessage(group.id, text);
      setGroupTyping(group.id, false);
    }

    setInputValue("");
  };

  // Resolve sender info
  const getSenderName = (senderId: string): string => {
    if (senderId === session.user.id) return "You";
    if (friend) return friend.userName || "Friend";
    if (group) {
      const member = group.members.find((m) => m.id === senderId);
      return (
        member?.userName ??
        (
          localMessages.find(
            (m) => m.senderId === senderId && "sender" in m,
          ) as GroupMessage | undefined
        )?.sender?.userName ??
        "Unknown"
      );
    }
    return "Unknown";
  };

  const getSenderAvatar = (msg: ChatMessage): string | null | undefined => {
    if (msg.senderId === session.user.id) return currentUserAvatarConfig;
    if (friend) return friend.avatarConfig;
    if (group) {
      const member = group.members.find((m) => m.id === msg.senderId);
      return (
        member?.avatarConfig ??
        ("sender" in msg
          ? (msg as GroupMessage).sender?.avatarConfig
          : undefined)
      );
    }
    return undefined;
  };

  const getIsRead = (msg: ChatMessage): boolean | undefined => {
    if (!friend) return undefined;
    return ("isRead" in msg && msg.isRead) || readAckSet.has(friend.id);
  };

  // Typing text
  let typingText = "";
  if (friend && isFriendTyping) {
    typingText = `${friend.userName} is typing...`;
  }
  if (group) {
    const typingNames = Object.entries(typingUsers)
      .filter(([, t]) => t)
      .map(([userId]) => {
        const member = group.members.find((m) => m.id === userId);
        return member?.userName || "Someone";
      });
    if (typingNames.length === 1) {
      typingText = `${typingNames[0]} is typing...`;
    } else if (typingNames.length === 2) {
      typingText = `${typingNames[0]} and ${typingNames[1]} are typing...`;
    } else if (typingNames.length > 2) {
      typingText = `${typingNames[0]} and ${typingNames.length - 1} others are typing...`;
    }
  }

  const placeholder = friend
    ? `Message @${friend.userName || "friend"}`
    : `Message ${group?.name}`;

  const emptyLabel = friend
    ? friend.userName || "your friend"
    : group?.name || "the group";

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (friend) setTyping(friend.id, value.length > 0);
    if (group) setGroupTyping(group.id, value.length > 0);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="scrollbar-custom flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-6 py-4"
      >
        <div className="flex-1" />
        {localMessages && localMessages.length > 0 ? (
          localMessages.map((m, i) => (
            <Message
              key={`${m.id}-${i}`}
              text={m.content}
              isOwn={m.senderId === session.user.id}
              senderName={getSenderName(m.senderId)}
              createdAt={m.createdAt}
              pending={m.id < 0}
              grouped={shouldGroupMessage(m, localMessages[i - 1])}
              senderId={m.senderId}
              avatarConfig={getSenderAvatar(m)}
              isRead={getIsRead(m)}
            />
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="bg-surface mb-3 flex h-14 w-14 items-center justify-center rounded-full">
              <Icon
                icon={friend ? "mdi:message-text" : "mdi:account-group"}
                className="text-2xl text-gray-500"
              />
            </div>
            <p className="text-sm font-medium text-white">
              Start {friend ? "a" : "the"} conversation
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Send a message to {emptyLabel}
            </p>
          </div>
        )}
      </div>

      <p className="mb-2 h-5 animate-pulse px-6 text-xs text-gray-500 italic">
        {typingText}
      </p>

      {/* Input bar */}
      <div className="border-border border-t px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            aria-label="Attach file"
            className="hover:bg-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-gray-300"
          >
            <Icon icon="mdi:plus-circle" className="text-xl" />
          </button>
          <input
            name="message"
            type="text"
            value={inputValue}
            placeholder={placeholder}
            className="border-border bg-surface focus:border-brand-500 flex-1 rounded-lg border px-4 py-2 text-sm text-white transition-colors outline-none placeholder:text-gray-500"
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            aria-label="Send message"
            onClick={handleSend}
            className="bg-brand-500 hover:bg-brand-600 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors"
          >
            <Icon icon="mdi:send" className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Messages;
