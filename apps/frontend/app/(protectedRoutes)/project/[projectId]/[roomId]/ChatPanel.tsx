"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";

type ChatMessage = {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  color: string;
};

type ChatPanelProps = {
  roomName: string;
  isOpen: boolean;
  onToggle: () => void;
};

function ChatPanel({ roomName, isOpen }: Omit<ChatPanelProps, "onToggle">) {
  const [message, setMessage] = useState("");

  // Placeholder messages for UI demonstration
  const messages: ChatMessage[] = [];

  if (!isOpen) return null;

  return (
    <div className="bg-secondary flex h-full w-full flex-col shadow-xl">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">Chat</h3>
      </div>

      {/* Messages */}
      <div className="scrollbar-thin flex flex-1 flex-col justify-end gap-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-surface mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
              <Icon icon="mdi:chat-outline" className="text-xl text-gray-600" />
            </div>
            <p className="text-xs text-gray-500">
              Start the conversation in &quot;{roomName}&quot;.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id}>
              <div className="mb-0.5 flex items-baseline gap-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: msg.color }}
                >
                  {msg.sender}
                </span>
                <span className="text-[10px] text-gray-600">
                  {msg.timestamp}
                </span>
              </div>
              <p className="text-sm text-gray-300">{msg.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-border border-t p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message...`}
            className="border-border bg-surface focus:border-brand-500 flex-1 rounded-lg border px-3 py-2 text-sm text-white transition-colors outline-none placeholder:text-gray-500"
          />
          <button
            disabled={!message.trim()}
            aria-label="Send message"
            className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/30 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white transition-colors disabled:cursor-not-allowed"
          >
            <Icon icon="mdi:send" className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
