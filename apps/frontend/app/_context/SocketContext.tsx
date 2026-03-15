"use client";

import {
  type PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  UserStatus,
  DirectMessage,
} from "@repo/types";
import { getWsToken } from "../_dataAccessLayer/userActions";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type SocketContextValue = {
  socket: TypedSocket | null;
  isConnected: boolean;
  statusMap: Record<string, UserStatus>;
  unreadMap: Record<string, number>;
  readAckSet: Set<string>;
  messagesMap: Record<string, DirectMessage[]>;
  sendMessage: (receiverId: string, content: string) => void;
  setTyping: (receiverId: string, isTyping: boolean) => void;
  markAsRead: (friendId: string) => void;
  syncMessages: (friendId: string, messages: DirectMessage[]) => void;
  pushMessage: (friendId: string, message: DirectMessage) => void;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  statusMap: {},
  unreadMap: {},
  readAckSet: new Set(),
  messagesMap: {},
  sendMessage: () => {},
  setTyping: () => {},
  markAsRead: () => {},
  syncMessages: () => {},
  pushMessage: () => {},
});

function SocketProvider({
  userId,
  children,
}: PropsWithChildren<{ userId: string }>) {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, UserStatus>>({});
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [readAckSet, setReadAckSet] = useState<Set<string>>(new Set());
  const [messagesMap, setMessagesMap] = useState<Record<string, DirectMessage[]>>(
    {},
  );
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSound.current = new Audio("/sounds/notification.mp3");
    notificationSound.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function connect() {
      try {
        const res = await getWsToken();
        if ("error" in res) return;
        const { token, salt } = res;

        if (cancelled) return;

        const socket = io(
          process.env.NEXT_PUBLIC_SERVER_BASE_URL || "http://localhost:3000",
          {
            transports: ["websocket"],
            auth: { token, salt },
          },
        ) as TypedSocket;

        socket.on("connect", () => setIsConnected(true));
        socket.on("disconnect", () => setIsConnected(false));

        socket.on("user:status", (update) => {
          setStatusMap((prev) => ({ ...prev, [update.userId]: update.status }));
        });

        socket.on("dm:unread", (counts) => {
          setUnreadMap(counts);
        });

        socket.on("dm:receive", (message) => {
          const friendId =
            message.senderId === userId ? message.receiverId : message.senderId;

          setMessagesMap((prev) => {
            const current = prev[friendId] || [];

            // If it's our message, replace the pending one
            if (message.senderId === userId) {
              const pendingIndex = current.findIndex(
                (m) => m.id < 0 && m.content === message.content,
              );
              if (pendingIndex !== -1) {
                const updated = [...current];
                updated[pendingIndex] = message;
                return { ...prev, [friendId]: updated };
              }
            }

            // Otherwise deduplicate and add
            if (current.some((m) => m.id === message.id)) return prev;
            return { ...prev, [friendId]: [...current, message] };
          });

          if (message.senderId !== userId) {
            setUnreadMap((prev) => ({
              ...prev,
              [message.senderId]: (prev[message.senderId] ?? 0) + 1,
            }));
            notificationSound.current?.play().catch(() => {});
          }
        });

        socket.on("dm:read-ack", ({ readBy }) => {
          setReadAckSet((prev) => new Set(prev).add(readBy));
        });

        socketRef.current = socket;
        setIsConnected(socket.connected);
      } catch (error) {
        console.error("Socket initialization error:", error);
      }
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.off();
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [userId]);

  const sendMessage = useCallback(
    (receiverId: string, content: string) => {
      socketRef.current?.emit("dm:send", {
        receiverId,
        content,
        senderId: userId,
      });
    },
    [userId],
  );

  const setTyping = useCallback((receiverId: string, isTyping: boolean) => {
    socketRef.current?.emit("dm:typing", { receiverId, isTyping });
  }, []);

  const markAsRead = useCallback((friendId: string) => {
    setUnreadMap((prev) => {
      if (!prev[friendId]) return prev;
      const next = { ...prev };
      delete next[friendId];
      return next;
    });
    socketRef.current?.emit("dm:read", { senderId: friendId });
  }, []);

  const syncMessages = useCallback(
    (friendId: string, messages: DirectMessage[]) => {
      setMessagesMap((prev) => {
        const current = prev[friendId] || [];
        const serverIds = new Set(messages.map((m) => m.id));

        // 1. Keep any fresh messages from socket that aren't in props yet
        const freshSocketItems = current.filter(
          (m) => m.id > 0 && !serverIds.has(m.id),
        );

        // 2. Keep any pending messages that aren't matched by content
        const matchedPendingIds = new Set<number>();
        messages.forEach((sm) => {
          const match = current.find(
            (pm) =>
              pm.id < 0 &&
              pm.content === sm.content &&
              !matchedPendingIds.has(pm.id),
          );
          if (match) matchedPendingIds.add(match.id);
        });

        const remainingPending = current.filter(
          (m) => m.id < 0 && !matchedPendingIds.has(m.id),
        );

        const merged = [...messages, ...freshSocketItems, ...remainingPending];
        // Sort to be safe
        merged.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        return { ...prev, [friendId]: merged };
      });
    },
    [],
  );

  const pushMessage = useCallback((friendId: string, message: DirectMessage) => {
    setMessagesMap((prev) => {
      const current = prev[friendId] || [];
      return { ...prev, [friendId]: [...current, message] };
    });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        statusMap,
        unreadMap,
        readAckSet,
        messagesMap,
        sendMessage,
        setTyping,
        markAsRead,
        syncMessages,
        pushMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

function useSocketContext() {
  const context = useContext(SocketContext);
  if (context === null)
    throw new Error("SocketContext was used outside of SocketProvider");

  return context;
}

export { SocketProvider, useSocketContext };
