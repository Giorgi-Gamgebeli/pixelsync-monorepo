"use client";

import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import ChatPanel from "./ChatPanel";
import Link from "next/link";
import dynamic from "next/dynamic";

const WhiteBoard = dynamic(() => import("@/app/_components/WhiteBoard"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-primary">
      <p className="text-sm text-gray-500">Loading canvas...</p>
    </div>
  ),
});

type RoomCanvasProps = {
  roomName: string;
  projectId: string;
  onlineCount: number;
  onInvite: () => void;
};

function RoomCanvas({
  roomName,
  projectId,
  onlineCount,
  onInvite,
}: RoomCanvasProps) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Minimal room header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/project/${projectId}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-surface hover:text-gray-300"
          >
            <Icon icon="mdi:arrow-left" className="text-lg" />
          </Link>
          <div className="h-4 w-px bg-border" />
          <h2 className="text-sm font-medium text-white">{roomName}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Online presence */}
          <div className="flex items-center gap-1.5 rounded-lg bg-surface/60 px-2.5 py-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-400">
              {onlineCount} online
            </span>
          </div>

          {/* Invite */}
          <button
            onClick={onInvite}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:bg-surface hover:text-white"
          >
            <Icon icon="mdi:share-variant" className="text-sm" />
            Share
          </button>

          {/* Chat toggle */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
              chatOpen
                ? "bg-brand-500/10 text-brand-400"
                : "text-gray-500 hover:bg-surface hover:text-gray-300"
            }`}
          >
            <Icon icon="mdi:chat-outline" className="text-lg" />
          </button>
        </div>
      </div>

      {/* Canvas + slide-over chat */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Canvas takes full width always */}
        <div className="flex-1">
          <WhiteBoard />
        </div>

        {/* Slide-over chat panel */}
        <div
          className={`absolute top-0 right-0 z-10 h-full transition-transform duration-300 ease-in-out ${
            chatOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <ChatPanel
            roomName={roomName}
            isOpen={chatOpen}
            onToggle={() => setChatOpen(!chatOpen)}
          />
        </div>
      </div>
    </div>
  );
}

export default RoomCanvas;
