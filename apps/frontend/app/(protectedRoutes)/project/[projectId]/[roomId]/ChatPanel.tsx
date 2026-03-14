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

function ChatPanel({ roomName, isOpen, onToggle }: ChatPanelProps) {
  const [message, setMessage] = useState("");

  // Placeholder messages for UI demonstration
  const messages: ChatMessage[] = [];

  if (!isOpen) return null;

  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-secondary shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-white">Chat</h3>
        <button
          onClick={onToggle}
          aria-label="Close chat"
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-surface hover:text-gray-300"
        >
          <Icon icon="mdi:close" className="text-base" />
        </button>
      </div>

      {/* Messages */}
      <div className="scrollbar-thin flex flex-1 flex-col justify-end gap-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface">
              <Icon
                icon="mdi:chat-outline"
                className="text-xl text-gray-600"
              />
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
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message...`}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-brand-500"
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
