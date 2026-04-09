export type ProfileUpdate = {
  userId: string;
  userName?: string | null;
  name?: string | null;
  avatarConfig?: string | null;
};

export type FriendRequestProfile = {
  id: string;
  userName: string | null;
  name: string | null;
  avatarConfig?: string | null;
};

export type FriendRequestUpdate = {
  direction: "incoming" | "outgoing";
  friend: FriendRequestProfile;
};

export type FriendAcceptedUpdate = {
  direction: "incoming" | "outgoing";
  friend: FriendRequestProfile & { status?: UserStatus };
};

export type FriendRemovedUpdate = {
  friendId: string;
};

export type FriendRequestActionResult =
  | { success: true }
  | { success: false; error: string };

export interface ServerToClientEvents extends ServerToCallEvents {
  "dm:receive": (message: DirectMessage) => void;
  "user:status": (update: { userId: string; status: UserStatus }) => void;
  "user:profile-update": (data: ProfileUpdate) => void;
  "friend:request": (data: FriendRequestUpdate) => void;
  "friend:accepted": (data: FriendAcceptedUpdate) => void;
  "friend:removed": (data: FriendRemovedUpdate) => void;
  "dm:typing": (data: { userId: string; isTyping: boolean }) => void;
  "group:receive": (message: GroupMessage) => void;
  "group:typing": (data: {
    groupId: number;
    userId: string;
    isTyping: boolean;
  }) => void;
}

export interface ClientToServerEvents extends ClientToCallEvents {
  "dm:send": (
    data: {
      id: string;
      receiverId: string;
      content: string;
      senderId: string;
    },
    ack: (response: { success: boolean; error: string }) => void,
  ) => void;
  "dm:typing": (data: { receiverId: string; isTyping: boolean }) => void;
  "user:profile-update": (data: Omit<ProfileUpdate, "userId">) => void;
  "user:set-status": (data: { status: UserStatus }) => void;
  "friend:request": (
    data: { userName: string },
    ack: (result: FriendRequestActionResult) => void,
  ) => void;
  "friend:accept": (
    data: { id: string },
    ack: (result: FriendRequestActionResult) => void,
  ) => void;
  "friend:unfriend": (
    data: { id: string },
    ack: (result: FriendRequestActionResult) => void,
  ) => void;
  "group:send": (data: {
    id: string;
    groupId: number;
    content: string;
  }) => void;
  "group:typing": (data: { groupId: number; isTyping: boolean }) => void;
  "group:join": (data: { groupId: number }) => void;
}

export type DirectMessage = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  receiverId: string;
  pending?: boolean;
  sender?: {
    userName: string;
    avatar?: string;
  };
};

export interface GroupMessage {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  groupId: number;
  senderId: string;
  pending?: boolean;
  sender?: {
    userName: string | null;
    avatarConfig?: string | null;
  };
}

export type UserStatus = "ONLINE" | "OFFLINE" | "IDLE" | "DO_NOT_DISTURB";

export type CallType = "audio" | "video";

export type CallMediaState = {
  userId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
};

export interface ServerToCallEvents {
  "call:ringing": (data: { callId: string }) => void;
  "call:incoming": (data: {
    callId: string;
    callerId: string;
    callerName: string;
    callType: CallType;
  }) => void;
  "call:accepted": (data: { callId: string; userId: string }) => void;
  "call:declined": (data: { callId: string; userId: string }) => void;
  "call:ended": (data: { callId: string; reason: string }) => void;
  "call:offer": (data: {
    callId: string;
    fromUserId: string;
    offer: { type: string; sdp?: string };
  }) => void;
  "call:answer": (data: {
    callId: string;
    fromUserId: string;
    answer: { type: string; sdp?: string };
  }) => void;
  "call:ice-candidate": (data: {
    callId: string;
    fromUserId: string;
    candidate: {
      candidate?: string;
      sdpMid?: string | null;
      sdpMLineIndex?: number | null;
    };
  }) => void;
  "call:group-joined": (data: {
    callId: string;
    groupId: number;
    userId: string;
    userName: string;
    participantCount: number;
  }) => void;
  "call:group-left": (data: {
    callId: string;
    groupId: number;
    userId: string;
    participantCount: number;
  }) => void;
  "call:group-call-started": (data: {
    groupId: number;
    callId: string;
    participantCount: number;
  }) => void;
  "call:group-call-ended": (data: { groupId: number }) => void;
  "call:group-active": (data: {
    callId: string;
    participants: { userId: string; userName: string }[];
  }) => void;
  "call:media-state": (data: CallMediaState) => void;
  "call:error": (data: { message: string }) => void;
}

export interface ClientToCallEvents {
  "call:initiate": (data: { receiverId: string; callType: CallType }) => void;
  "call:accept": (data: { callId: string }) => void;
  "call:decline": (data: { callId: string }) => void;
  "call:hangup": (data: { callId: string }) => void;
  "call:offer": (data: {
    callId: string;
    toUserId: string;
    offer: { type: string; sdp?: string };
  }) => void;
  "call:answer": (data: {
    callId: string;
    toUserId: string;
    answer: { type: string; sdp?: string };
  }) => void;
  "call:ice-candidate": (data: {
    callId: string;
    toUserId: string;
    candidate: {
      candidate?: string;
      sdpMid?: string | null;
      sdpMLineIndex?: number | null;
    };
  }) => void;
  "call:group-join": (data: { groupId: number; callType: CallType }) => void;
  "call:group-leave": (data: { callId: string }) => void;
  "call:media-state": (data: {
    callId: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) => void;
}
