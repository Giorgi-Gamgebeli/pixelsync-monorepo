"use client";

import { useSocketContext } from "@/app/_context/SocketContext";
import { Icon } from "@iconify/react/dist/iconify.js";
import type { DirectMessage, GroupMessage, UserStatus } from "@repo/types";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { useEffect, useRef, useState } from "react";
import Message from "./Message";
import {
  getEmptyLabel,
  getPlaceholder,
  handleGroupReceive,
  getSenderAvatar,
  getSenderName,
  getTypingText,
  shouldGroupMessage,
  submitMessage,
} from "@/app/_lib/chatMessageHelpers";

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
    sendGroupMessage,
    setGroupTyping,
  } = useSocketContext();

  const [inputValue, setInputValue] = useState("");
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isFriendTyping, typingUsers]);

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
      const onTyping = (data: {
        groupId: number;
        userId: string;
        isTyping: boolean;
      }) => {
        if (data.groupId !== groupId) return;
        if (data.userId === session.user.id) return;
        setTypingUsers((prev) => ({ ...prev, [data.userId]: data.isTyping }));
      };

      socket.on("group:receive", (message) =>
        handleGroupReceive({
          message,
          groupId,
          queryClient,
        }),
      );
      socket.on("group:typing", onTyping);
      return () => {
        socket.off("group:receive");
        socket.off("group:typing", onTyping);
      };
    }
  }, [isConnected, socket, session.user.id, friendId, groupId, queryClient]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (friend) setTyping(friend.id, value.length > 0);
    if (group) setGroupTyping(group.id, value.length > 0);
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    submitMessage({
      text,
      friend,
      group,
      sessionUserId: session.user.id,
      sessionUserName: session.user.userName,
      currentUserAvatarConfig,
      queryClient,
      sendMessage,
      setTyping,
      sendGroupMessage,
      setGroupTyping,
    });

    setInputValue("");
  };

  const typingText = getTypingText({
    friend,
    isFriendTyping,
    group,
    typingUsers,
  });
  const placeholder = getPlaceholder(friend, group);
  const emptyLabel = getEmptyLabel(friend, group);

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="scrollbar-custom flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-6 py-4"
      >
        <div className="flex-1" />
        {messages && messages.length > 0 ? (
          messages.map((m, i) => (
            <Message
              key={`${m.id}-${i}`}
              text={m.content}
              isOwn={m.senderId === session.user.id}
              senderName={getSenderName({
                senderId: m.senderId,
                sessionUserId: session.user.id,
                friend,
                group,
                messages,
              })}
              createdAt={m.createdAt}
              pending={Boolean(m.pending)}
              grouped={shouldGroupMessage(m, messages[i - 1])}
              senderId={m.senderId}
              avatarConfig={getSenderAvatar({
                senderId: m.senderId,
                sessionUserId: session.user.id,
                friend,
                group,
                currentUserAvatarConfig,
                message: m,
              })}
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
