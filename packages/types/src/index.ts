export type ProfileUpdate = {
  userId: string;
  userName?: string | null;
  name?: string | null;
  avatarConfig?: string | null;
};

export interface ServerToClientEvents {
  "dm:receive": (message: DirectMessage) => void;
  "user:status": (update: { userId: string; status: UserStatus }) => void;
  "user:profile-update": (data: ProfileUpdate) => void;
  "dm:typing": (data: { userId: string; isTyping: boolean }) => void;
  "dm:unread": (counts: Record<string, number>) => void;
  "dm:read-ack": (data: { readBy: string }) => void;
  "group:receive": (message: GroupMessage) => void;
  "group:typing": (data: { groupId: number; userId: string; isTyping: boolean }) => void;
}

export interface ClientToServerEvents {
  "dm:send": (data: { receiverId: string; content: string; senderId: string }) => void;
  "dm:typing": (data: { receiverId: string; isTyping: boolean }) => void;
  "dm:read": (data: { senderId: string }) => void;
  "user:profile-update": (data: Omit<ProfileUpdate, "userId">) => void;
  "group:send": (data: { groupId: number; content: string }) => void;
  "group:typing": (data: { groupId: number; isTyping: boolean }) => void;
  "group:join": (data: { groupId: number }) => void;
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

export interface GroupMessage {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  groupId: number;
  senderId: string;
  sender?: {
    userName: string | null;
    avatarConfig?: string | null;
  };
}

export type UserStatus = "ONLINE" | "OFFLINE" | "IDLE" | "DO_NOT_DISTURB";
