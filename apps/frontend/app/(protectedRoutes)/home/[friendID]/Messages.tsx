"use client";

import { UserStatus } from "@repo/types";
import type { DirectMessage } from "@repo/db";
import { Session } from "next-auth";
import Message from "./Message";
import { Icon } from "@iconify/react/dist/iconify.js";

type MessagesProps = {
  messages: DirectMessage[] | undefined;
  session: Session;
  friend:
    | {
        id: string;
        status: UserStatus;
        userName: string | null;
        image: string | null;
      }
    | undefined;
};

function Messages({ messages, friend, session }: MessagesProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="scrollbar-thin flex flex-1 flex-col justify-end gap-1 overflow-y-auto px-6 py-4">
        {messages && messages.length > 0 ? (
          messages.map((m, i) => (
            <Message
              key={i}
              text={m.content}
              isOwn={m.senderId === session.user.id}
              senderName={
                m.senderId === session.user.id
                  ? "You"
                  : friend?.userName || "Friend"
              }
            />
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface">
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

      {/* Input bar */}
      <div className="border-t border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-surface hover:text-gray-300">
            <Icon icon="mdi:plus-circle" className="text-xl" />
          </button>
          <input
            name="message"
            type="text"
            placeholder={`Message @${friend?.userName || "friend"}`}
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-brand-500"
          />
          <button className="bg-brand-500 hover:bg-brand-600 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors">
            <Icon icon="mdi:send" className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Messages;
