"use client";

import { useState, useEffect } from "react";
import { useSocket } from "../_hooks/useSocket";
import toast, { Toaster } from "react-hot-toast";
import { DirectMessage } from "@repo/types";
import { getMessages, getUsers } from "../api/messages";

import ChatHeader from "./components/ChatHeader";
import MessageInput from "./components/MessageInput";
import MessageList from "./components/MessageList";
import ReceiverSelector from "./components/ReceiverSelector";
import UserSelection from "./components/UserSelection";

export default function TestPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [receiverId, setReceiverId] = useState<number>(1);
  const [isTyping, setIsTyping] = useState(false);

  const { socket, sendMessage, startTyping, stopTyping } = useSocket(
    currentUser?.id,
  );

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to load users:", error);
        toast.error("Failed to load users");
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const loadMessages = async () => {
      const data = await getMessages(currentUser.id);
      setMessages(data);
    };
    loadMessages();
  }, [currentUser]);

  useEffect(() => {
    if (!socket) return;

    socket.on("message:receive", (message: DirectMessage) => {
      setMessages((prev) => [...prev, message]);
      const sender = users.find((u) => u.id === message.senderId);
      toast.success(`New message from ${sender?.firstName}`);
    });

    socket.on("typing:start", (userId: number) => {
      if (userId === receiverId) setIsTyping(true);
    });

    socket.on("typing:stop", (userId: number) => {
      if (userId === receiverId) setIsTyping(false);
    });

    return () => {
      socket.off("message:receive");
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [socket, receiverId, users]);

  const handleSendMessage = (content: string) => {
    if (!content.trim() || !currentUser) return;

    const newMessage: DirectMessage = {
      id: Date.now(),
      content,
      senderId: currentUser.id,
      receiverId,
      createdAt: new Date(),
    };

    sendMessage(receiverId, content);
    setMessages((prev) => [...prev, newMessage]);
    stopTyping(receiverId);
  };

  const handleTyping = (value: string) => {
    if (value && currentUser) {
      startTyping(receiverId);
    } else {
      stopTyping(receiverId);
    }
  };

  if (!currentUser) {
    return <UserSelection users={users} onSelectUser={setCurrentUser} />;
  }

  return (
    <div className="p-8">
      <ChatHeader
        currentUser={currentUser}
        onSwitchUser={() => setCurrentUser(null)}
      />
      <ReceiverSelector
        users={users.filter((u) => u.id !== currentUser.id)}
        receiverId={receiverId}
        onChange={setReceiverId}
      />
      <MessageList
        messages={messages}
        currentUser={currentUser}
        receiverId={receiverId}
        isTyping={isTyping}
        users={users}
      />
      <MessageInput onSend={handleSendMessage} onTyping={handleTyping} />
      <Toaster />
    </div>
  );
}
