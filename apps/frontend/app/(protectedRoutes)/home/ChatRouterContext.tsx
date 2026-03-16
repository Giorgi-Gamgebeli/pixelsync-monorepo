"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { fetchDM, fetchGroup } from "@/app/_lib/chatCache";

export type SelectedChat =
  | { type: "dm"; friendId: string }
  | { type: "group"; groupId: number }
  | null;

type ChatRouterContextValue = {
  selectedChat: SelectedChat;
  selectChat: (chat: NonNullable<SelectedChat>) => void;
  clearChat: () => void;
};

const ChatRouterContext = createContext<ChatRouterContextValue>({
  selectedChat: null,
  selectChat: () => {},
  clearChat: () => {},
});

function chatFromParams(params: URLSearchParams): SelectedChat {
  const dm = params.get("dm");
  if (dm) return { type: "dm", friendId: dm };

  const group = params.get("group");
  if (group) return { type: "group", groupId: Number(group) };

  return null;
}

function buildChatUrl(chat: NonNullable<SelectedChat>): string {
  if (chat.type === "dm") return `/home?dm=${chat.friendId}`;
  return `/home?group=${chat.groupId}`;
}

export function ChatRouterProvider({ children }: PropsWithChildren) {
  const [selectedChat, setSelectedChat] = useState<SelectedChat>(null);

  // Initialize from URL query params on mount
  useEffect(() => {
    const initial = chatFromParams(new URLSearchParams(window.location.search));
    if (initial) setSelectedChat(initial);
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    function onPopState() {
      const chat = chatFromParams(new URLSearchParams(window.location.search));
      setSelectedChat(chat);
      if (chat?.type === "dm") fetchDM(chat.friendId);
      else if (chat?.type === "group") fetchGroup(chat.groupId);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const selectChat = useCallback((chat: NonNullable<SelectedChat>) => {
    setSelectedChat(chat);
    window.history.pushState({}, "", buildChatUrl(chat));
    if (chat.type === "dm") fetchDM(chat.friendId);
    else fetchGroup(chat.groupId);
  }, []);

  const clearChat = useCallback(() => {
    setSelectedChat(null);
  }, []);

  return (
    <ChatRouterContext.Provider value={{ selectedChat, selectChat, clearChat }}>
      {children}
    </ChatRouterContext.Provider>
  );
}

export function useChatRouter() {
  return useContext(ChatRouterContext);
}
