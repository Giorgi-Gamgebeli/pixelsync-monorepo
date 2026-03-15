export interface ServerToClientEvents {
  "dm:receive": (message: DirectMessage) => void;
  "user:status": (update: { userId: string; status: UserStatus }) => void;
  "dm:typing": (data: { userId: string; isTyping: boolean }) => void;
  "dm:unread": (counts: Record<string, number>) => void;
}

export interface ClientToServerEvents {
  "dm:send": (data: { receiverId: string; content: string; senderId: string }) => void;
  "dm:typing": (data: { receiverId: string; isTyping: boolean }) => void;
  "dm:read": (data: { senderId: string }) => void;
}

export interface DirectMessage {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  senderId: string;
  receiverId: string;
  sender?: {
    userName: string;
    avatar?: string;
  };
}

export type UserStatus = "ONLINE" | "OFFLINE" | "IDLE" | "DO_NOT_DISTURB";
