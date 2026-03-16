"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { usePathname } from "next/navigation";

type ActiveView =
  | { type: "dm"; friendId: string }
  | { type: "group"; groupId: number }
  | null;

type ChatRouterContextValue = {
  activeView: ActiveView;
  navigateToChat: (view: NonNullable<ActiveView>) => void;
};

const ChatRouterContext = createContext<ChatRouterContextValue>({
  activeView: null,
  navigateToChat: () => {},
});

export function parsePathToView(pathname: string): ActiveView {
  const groupMatch = pathname.match(/^\/home\/group\/(\d+)/);
  if (groupMatch) return { type: "group", groupId: Number(groupMatch[1]) };

  const dmMatch = pathname.match(/^\/home\/([^/]+)/);
  if (
    dmMatch &&
    dmMatch[1] &&
    dmMatch[1] !== "friends" &&
    dmMatch[1] !== "group"
  ) {
    return { type: "dm", friendId: dmMatch[1] };
  }

  return null;
}

export function ChatRouterProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [activeView, setActiveView] = useState<ActiveView>(null);

  // When Next.js does a real navigation (pathname changes), clear activeView
  // so ChatPanel falls through to server-rendered {children}
  useEffect(() => {
    setActiveView(null);
  }, [pathname]);

  // Handle browser back/forward between pushState chat URLs
  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      if (e.state?.chatRouter) {
        setActiveView(parsePathToView(window.location.pathname));
      } else {
        setActiveView(null);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateToChat = useCallback((view: NonNullable<ActiveView>) => {
    setActiveView(view);
    const url =
      view.type === "dm"
        ? `/home/${view.friendId}`
        : `/home/group/${view.groupId}`;
    window.history.pushState({ chatRouter: true }, "", url);
  }, []);

  return (
    <ChatRouterContext.Provider value={{ activeView, navigateToChat }}>
      {children}
    </ChatRouterContext.Provider>
  );
}

export function useChatRouter() {
  return useContext(ChatRouterContext);
}
