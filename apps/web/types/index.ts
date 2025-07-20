export interface ServerToClientEvents {
  "message:receive": (message: DirectMessage) => void;
  "friend:status": (update: { userId: number; status: UserStatus }) => void;
  "typing:start": (userId: number) => void;
  "typing:stop": (userId: number) => void;
}

export interface ClientToServerEvents {
  "user:connect": (userId: number) => void;
  "message:send": (data: { receiverId: number; content: string }) => void;
  "typing:start": (receiverId: number) => void;
  "typing:stop": (receiverId: number) => void;
}

export interface DirectMessage {
  id: number;
  content: string;
  createdAt: Date;
  senderId: number;
  receiverId: number;
  sender?: {
    userName: string;
    avatar?: string;
  };
}

export type UserStatus = "ONLINE" | "OFFLINE" | "IDLE" | "DO_NOT_DISTURB";
