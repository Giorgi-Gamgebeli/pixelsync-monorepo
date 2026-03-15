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
} from "@repo/types";
import { getWsToken } from "../_dataAccessLayer/userActions";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type SocketContextValue = {
  socket: TypedSocket | null;
  isConnected: boolean;
  statusMap: Record<string, UserStatus>;
  sendMessage: (receiverId: string, content: string) => void;
  setTyping: (receiverId: string, isTyping: boolean) => void;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  statusMap: {},
  sendMessage: () => {},
  setTyping: () => {},
});

export function SocketProvider({
  userId,
  children,
}: PropsWithChildren<{ userId: string }>) {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, UserStatus>>({});

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

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        statusMap,
        sendMessage,
        setTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

export function useUserStatus(
  userId: string,
  serverStatus?: UserStatus,
): UserStatus {
  const { statusMap } = useContext(SocketContext);
  return statusMap[userId] ?? serverStatus ?? "OFFLINE";
}
