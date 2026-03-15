"use client";

import { UserStatus, GroupMessage } from "@repo/types";
import { Session } from "next-auth";
import Message from "../../[friendID]/Message";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useSocketContext } from "@/app/_context/SocketContext";
import { useEffect, useRef, useState } from "react";

const GROUPING_WINDOW_MS = 5 * 60 * 1000;

function shouldGroupMessage(
  current: GroupMessage,
  previous: GroupMessage | undefined,
): boolean {
  if (!previous) return false;
  if (current.senderId !== previous.senderId) return false;
  return (
    new Date(current.createdAt).getTime() -
      new Date(previous.createdAt).getTime() <
    GROUPING_WINDOW_MS
  );
}

type GroupMessagesProps = {
  messages: GroupMessage[];
  session: Session;
  group: {
    id: number;
    name: string;
    members: {
      id: string;
      userName: string | null;
      avatarConfig?: string | null;
      status: UserStatus;
    }[];
  };
  currentUserAvatarConfig?: string | null;
};

function GroupMessages({
  messages,
  group,
  session,
  currentUserAvatarConfig,
}: GroupMessagesProps) {
  const { socket, isConnected, sendGroupMessage, setGroupTyping } =
    useSocketContext();

  const [localMessages, setLocalMessages] = useState<GroupMessage[]>(messages);
  const [inputValue, setInputValue] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMessages(messages || []);
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [localMessages, typingUsers]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onReceive = (message: GroupMessage) => {
      if (message.groupId !== group.id) return;

      setLocalMessages((prev) => {
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
      });
    };

    const onTyping = (data: {
      groupId: number;
      userId: string;
      isTyping: boolean;
    }) => {
      if (data.groupId !== group.id) return;
      if (data.userId === session.user.id) return;
      setTypingUsers((prev) => ({ ...prev, [data.userId]: data.isTyping }));
    };

    socket.on("group:receive", onReceive);
    socket.on("group:typing", onTyping);
    return () => {
      socket.off("group:receive", onReceive);
      socket.off("group:typing", onTyping);
    };
  }, [isConnected, socket, group.id, session.user.id]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const optimisticId = -Date.now();

    setLocalMessages((prev) => [
      ...prev,
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
    ]);

    sendGroupMessage(group.id, text);
    setInputValue("");
    setGroupTyping(group.id, false);
  };

  const getMemberInfo = (senderId: string) => {
    return group.members.find((m) => m.id === senderId);
  };

  const typingNames = Object.entries(typingUsers)
    .filter(([, isTyping]) => isTyping)
    .map(([userId]) => {
      const member = getMemberInfo(userId);
      return member?.userName || "Someone";
    });

  const typingText =
    typingNames.length === 1
      ? `${typingNames[0]} is typing...`
      : typingNames.length === 2
        ? `${typingNames[0]} and ${typingNames[1]} are typing...`
        : typingNames.length > 2
          ? `${typingNames[0]} and ${typingNames.length - 1} others are typing...`
          : "";

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="scrollbar-custom flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-6 py-4"
      >
        <div className="flex-1" />
        {localMessages && localMessages.length > 0 ? (
          localMessages.map((m, i) => {
            const member = getMemberInfo(m.senderId);
            const senderAvatar =
              m.senderId === session.user.id
                ? currentUserAvatarConfig
                : (member?.avatarConfig ?? m.sender?.avatarConfig);

            return (
              <Message
                key={`${m.id}-${i}`}
                text={m.content}
                isOwn={m.senderId === session.user.id}
                senderName={
                  m.senderId === session.user.id
                    ? "You"
                    : (member?.userName ??
                      m.sender?.userName ??
                      "Unknown")
                }
                createdAt={m.createdAt}
                pending={m.id < 0}
                grouped={shouldGroupMessage(m, localMessages[i - 1])}
                senderId={m.senderId}
                avatarConfig={senderAvatar}
              />
            );
          })
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="bg-surface mb-3 flex h-14 w-14 items-center justify-center rounded-full">
              <Icon
                icon="mdi:account-group"
                className="text-2xl text-gray-500"
              />
            </div>
            <p className="text-sm font-medium text-white">
              Start the conversation
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Send a message to {group.name}
            </p>
          </div>
        )}
      </div>

      <p className="mb-2 h-5 animate-pulse px-6 text-xs text-gray-500 italic">
        {typingText}
      </p>

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
            placeholder={`Message ${group.name}`}
            className="border-border bg-surface focus:border-brand-500 flex-1 rounded-lg border px-4 py-2 text-sm text-white transition-colors outline-none placeholder:text-gray-500"
            onChange={(e) => {
              setInputValue(e.target.value);
              setGroupTyping(group.id, e.target.value.length > 0);
            }}
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

export default GroupMessages;
