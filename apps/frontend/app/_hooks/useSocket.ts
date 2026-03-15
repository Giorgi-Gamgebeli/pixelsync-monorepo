import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "@repo/types";

export function useSocket(userId: string) {
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    try {
      const socket = io(
        process.env.NEXT_PUBLIC_SERVER_BASE_URL || "http://localhost:3000",
        {
          withCredentials: true,
          transports: ["websocket"],
        },
      );

      socket.on("connect", () => setIsConnected(true));
      socket.on("disconnect", () => setIsConnected(false));

      socketRef.current = socket;
      setIsConnected(socket.connected);
    } catch (error) {
      console.error("Socket initialization error:", error);
    }

    return () => {
      socketRef.current?.off();
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [userId]);

  const sendMessage = (receiverId: string, content: string) => {
    socketRef.current?.emit("dm:send", {
      receiverId,
      content,
      senderId: userId,
    });
  };

  const setTyping = (receiverId: string, isTyping: boolean) => {
    socketRef.current?.emit("dm:typing", { receiverId, isTyping });
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    setTyping,
  };
}
