"use client";

import {
  ClientToServerEvents,
  ProfileUpdate,
  ServerToClientEvents,
  UserStatus,
} from "@repo/types";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { getWsToken } from "../_dataAccessLayer/userActions";
import { useQueryClient } from "@tanstack/react-query";
import { setChatMessage } from "../_lib/chatQueryCache";
import { dmChatKey } from "../_lib/chatQueryKeys";
import type { DMChatPageData } from "../_lib/chatQueryTypes";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type SocketContextValue = {
  socket: TypedSocket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  statusMap: Record<string, UserStatus>;
  profileMap: Record<string, Partial<ProfileUpdate>>;
  sendMessage: (receiverId: string, content: string, id: string) => void;
  setTyping: (receiverId: string, isTyping: boolean) => void;
  broadcastProfileUpdate: (data: Omit<ProfileUpdate, "userId">) => void;
  sendGroupMessage: (groupId: number, content: string, id: string) => void;
  setGroupTyping: (groupId: number, isTyping: boolean) => void;
  joinGroup: (groupId: number) => void;
  setStatus: (status: UserStatus) => void;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  statusMap: {},
  profileMap: {},
  sendMessage: () => {},
  setTyping: () => {},
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
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, UserStatus>>({});
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

        socket.on("dm:receive", (message) => {
          const otherUserId =
            message.senderId === userId ? message.receiverId : message.senderId;
          setChatMessage<DMChatPageData>(
            queryClient,
            dmChatKey(otherUserId),
            message,
          );

          if (message.senderId !== userId) {
            notificationSound.current?.play().catch(() => {});
          }
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
  }, [userId, queryClient]);

  const sendMessage = useCallback(
    (receiverId: string, content: string, id: string) => {
      socketRef.current?.emit("dm:send", {
        id,
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

  const broadcastProfileUpdate = useCallback(
    (data: Omit<ProfileUpdate, "userId">) => {
      socketRef.current?.emit("user:profile-update", data);
    },
    [],
  );

  const sendGroupMessage = useCallback(
    (groupId: number, content: string, id: string) => {
      socketRef.current?.emit("group:send", { id, groupId, content });
    },
    [],
  );

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
        profileMap,
        sendMessage,
        setTyping,
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
