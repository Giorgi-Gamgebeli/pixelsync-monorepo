import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "@repo/types";
import toast from "react-hot-toast";

export function useSocket(userId: number) {
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  useEffect(() => {
    if (!userId) return;

    try {
      console.log("Connecting to socket server...");
      socketRef.current = io(
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
        {
          withCredentials: true,
          transports: ["websocket"],
        },
      );

      socketRef.current.on("connect", () => {
        console.log("Socket connected");
        socketRef.current?.emit("user:connect", userId);
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        toast.error("Failed to connect to chat server");
      });
    } catch (error) {
      console.error("Socket initialization error:", error);
    }

    return () => {
      console.log("Disconnecting socket...");
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const sendMessage = (receiverId: number, content: string) => {
    if (!socketRef.current?.connected) {
      console.warn("Socket not connected");
      toast.error("Not connected to chat server");
      return;
    }
    socketRef.current.emit("message:send", { receiverId, content });
  };

  const startTyping = (receiverId: number) => {
    socketRef.current?.emit("typing:start", receiverId);
  };

  const stopTyping = (receiverId: number) => {
    socketRef.current?.emit("typing:stop", receiverId);
  };

  return {
    socket: socketRef.current,
    sendMessage,
    startTyping,
    stopTyping,
  };
}
