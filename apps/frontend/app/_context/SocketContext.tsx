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
  ProfileUpdate,
  UserStatus,
} from "@repo/types";
import { getWsToken } from "../_dataAccessLayer/userActions";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type SocketContextValue = {
  socket: TypedSocket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  statusMap: Record<string, UserStatus>;
  unreadMap: Record<string, number>;
  readAckSet: Set<string>;
  profileMap: Record<string, Partial<ProfileUpdate>>;
  sendMessage: (receiverId: string, content: string) => void;
  setTyping: (receiverId: string, isTyping: boolean) => void;
  markAsRead: (friendId: string) => void;
  broadcastProfileUpdate: (data: Omit<ProfileUpdate, "userId">) => void;
  sendGroupMessage: (groupId: number, content: string) => void;
  setGroupTyping: (groupId: number, isTyping: boolean) => void;
  joinGroup: (groupId: number) => void;
  setStatus: (status: UserStatus) => void;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  statusMap: {},
  unreadMap: {},
  readAckSet: new Set(),
  profileMap: {},
  sendMessage: () => {},
  setTyping: () => {},
  markAsRead: () => {},
  broadcastProfileUpdate: () => {},
  sendGroupMessage: () => {},
  setGroupTyping: () => {},
  joinGroup: () => {},
  setStatus: () => {},
});

function SocketProvider({
  userId,
  children,
}: PropsWithChildren<{ userId: string }>) {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, UserStatus>>({});
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [readAckSet, setReadAckSet] = useState<Set<string>>(new Set());
  const [profileMap, setProfileMap] = useState<
    Record<string, Partial<ProfileUpdate>>
  >({});
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
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
          },
        ) as TypedSocket;

        socket.on("connect", () => {
          setIsConnected(true);
          setIsReconnecting(false);
        });
        socket.on("disconnect", () => {
          setIsConnected(false);
          setIsReconnecting(true);
        });

        socket.io.on("reconnect_failed", () => {
          setIsReconnecting(false);
        });

        socket.on("user:status", (update) => {
          setStatusMap((prev) => ({ ...prev, [update.userId]: update.status }));
        });

        socket.on("dm:unread", (counts) => {
          setUnreadMap(counts);
        });

        socket.on("dm:receive", (message) => {
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

        socket.on("user:profile-update", (data) => {
          setProfileMap((prev) => ({
            ...prev,
            [data.userId]: { ...prev[data.userId], ...data },
          }));
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

  const broadcastProfileUpdate = useCallback(
    (data: Omit<ProfileUpdate, "userId">) => {
      socketRef.current?.emit("user:profile-update", data);
    },
    [],
  );

  const sendGroupMessage = useCallback((groupId: number, content: string) => {
    socketRef.current?.emit("group:send", { groupId, content });
  }, []);

  const setGroupTyping = useCallback((groupId: number, isTyping: boolean) => {
    socketRef.current?.emit("group:typing", { groupId, isTyping });
  }, []);

  const joinGroup = useCallback((groupId: number) => {
    socketRef.current?.emit("group:join", { groupId });
  }, []);

  const setStatus = useCallback((status: UserStatus) => {
    socketRef.current?.emit("user:set-status", { status });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        isReconnecting,
        statusMap,
        unreadMap,
        readAckSet,
        profileMap,
        sendMessage,
        setTyping,
        markAsRead,
        broadcastProfileUpdate,
        sendGroupMessage,
        setGroupTyping,
        joinGroup,
        setStatus,
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
