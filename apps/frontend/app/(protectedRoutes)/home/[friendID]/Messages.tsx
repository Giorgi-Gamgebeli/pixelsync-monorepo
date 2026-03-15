"use client";

import { UserStatus, DirectMessage } from "@repo/types";
import { Session } from "next-auth";
import Message from "./Message";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useSocketContext } from "@/app/_context/SocketContext";
import { useEffect, useRef, useState } from "react";

type MessagesProps = {
  messages: DirectMessage[];
  session: Session;
  friend: {
    id: string;
    status: UserStatus;
    userName: string | null;
  };
};

function Messages({ messages, friend, session }: MessagesProps) {
  const { socket, isConnected, sendMessage, setTyping, markAsRead } =
    useSocketContext();

  const [localMessages, setLocalMessages] = useState<DirectMessage[]>(messages);
  const [inputValue, setInputValue] = useState("");
  const [isFriendTyping, setIsFriendTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMessages(messages || []);
  }, [messages]);

  useEffect(() => {
    markAsRead(friend.id);
  }, [friend.id, markAsRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [localMessages, isFriendTyping]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onReceive = (message: DirectMessage) => {
      setLocalMessages((prev) => {
        // If it's our own message, find and replace the pending one
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

    const onTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === friend.id) {
        setIsFriendTyping(data.isTyping);
      }
    };
    socket.on("dm:receive", onReceive);
    socket.on("dm:typing", onTyping);
    return () => {
      socket.off("dm:receive", onReceive);
      socket.off("dm:typing", onTyping);
    };
  }, [isConnected, socket, friend.id, session.user.id]);

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
        receiverId: friend.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
      },
    ]);

    sendMessage(friend.id, text);
    setInputValue("");
    setTyping(friend.id, false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="scrollbar-custom flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-6 py-4"
      >
        <div className="flex-1" /> {/* Spacer to push messages to bottom */}
        {localMessages && localMessages.length > 0 ? (
          localMessages.map((m, i) => (
            <Message
              key={`${m.id}-${i}`}
              text={m.content}
              isOwn={m.senderId === session.user.id}
              senderName={
                m.senderId === session.user.id
                  ? "You"
                  : friend?.userName || "Friend"
              }
              createdAt={m.createdAt}
              pending={m.id < 0}
            />
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="bg-surface mb-3 flex h-14 w-14 items-center justify-center rounded-full">
              <Icon
                icon="mdi:message-text"
                className="text-2xl text-gray-500"
              />
            </div>
            <p className="text-sm font-medium text-white">
              Start a conversation
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Send a message to {friend?.userName || "your friend"}
            </p>
          </div>
        )}
      </div>

      <p className="mb-2 h-5 animate-pulse px-6 text-xs text-gray-500 italic">
        {isFriendTyping && `${friend?.userName} is typing...`}
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
            placeholder={`Message @${friend?.userName || "friend"}`}
            className="border-border bg-surface focus:border-brand-500 flex-1 rounded-lg border px-4 py-2 text-sm text-white transition-colors outline-none placeholder:text-gray-500"
            onChange={(e) => {
              setInputValue(e.target.value);
              if (friend?.id) setTyping(friend.id, e.target.value.length > 0);
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

export default Messages;
