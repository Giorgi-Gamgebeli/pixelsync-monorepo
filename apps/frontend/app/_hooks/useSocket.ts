import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "@repo/types";

export function useSocket(userId: string) {
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  useEffect(() => {
    if (!userId) return;

    try {
      socketRef.current = io(
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
        {
          withCredentials: true,
          transports: ["websocket"],
        },
      );
    } catch (error) {
      console.error("Socket initialization error:", error);
    }

    return () => {
      socketRef.current?.off();
      socketRef.current?.disconnect();
      socketRef.current = null;
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
    sendMessage,
    setTyping,
  };
}
