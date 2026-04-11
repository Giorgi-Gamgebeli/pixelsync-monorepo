"use client";

import {
  ClientToServerEvents,
  FriendAcceptedUpdate,
  FriendRequestActionResult,
  FriendRemovedUpdate,
  ProfileUpdate,
  ServerToClientEvents,
  UserStatus,
  DirectMessage,
} from "@repo/types";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type RefObject,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { getWsToken } from "../_dataAccessLayer/userActions";
import { useQueryClient } from "@tanstack/react-query";
import { setChatMessage } from "../_lib/chatQueryCache";
import {
  upsertFriendInCache,
  removeFriendFromCache,
  removePendingFriendRequest,
  type FriendsPageData,
  type PendingFriendRequestsData,
  updateFriendPresenceInCache,
  updateFriendProfileInCache,
  upsertPendingFriendRequest,
} from "../_lib/friendsQueryCache";
import { groupChatKey } from "../_lib/chatQueryKeys";
import {
  friendsPageKey,
  pendingFriendRequestsKey,
} from "../_lib/friendsQueryKeys";
import type { GroupChatPageData } from "../_lib/chatQueryTypes";
import {
  handleDMReceiveAction,
  sendMessageAction,
  setTypingAction,
} from "../_dataAccessLayer/socketActions/dmSocketActions";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type StatusUpdate = Parameters<ServerToClientEvents["user:status"]>[0];

type ProfileUpdateEvent = Parameters<
  ServerToClientEvents["user:profile-update"]
>[0];

type DmReceiveEvent = Parameters<ServerToClientEvents["dm:receive"]>[0];
type GroupReceiveEvent = Parameters<ServerToClientEvents["group:receive"]>[0];
type FriendRequestEvent = Parameters<ServerToClientEvents["friend:request"]>[0];
type FriendAcceptedEvent = FriendAcceptedUpdate;
type FriendRemovedEvent = FriendRemovedUpdate;

function playNotificationSound(
  notificationSound: RefObject<HTMLAudioElement | null>,
) {
  notificationSound.current?.play().catch(() => {});
}

type SocketContextValue = {
  socket: TypedSocket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  sendMessage: (data: DirectMessage) => void;
  setTyping: (receiverId: string, isTyping: boolean) => void;
  broadcastProfileUpdate: (data: Omit<ProfileUpdate, "userId">) => void;
  sendFriendRequest: (userName: string) => void;
  sendGroupMessage: (groupId: number, content: string, id: string) => void;
  setGroupTyping: (groupId: number, isTyping: boolean) => void;
  joinGroup: (groupId: number) => void;
  setStatus: (status: UserStatus) => void;
  acceptFriendRequest: (id: string) => void;
  unfriend: (id: string) => void;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  sendMessage: () => {},
  setTyping: () => {},
  broadcastProfileUpdate: () => {},
  sendFriendRequest: () => {},
  sendGroupMessage: () => {},
  setGroupTyping: () => {},
  joinGroup: () => {},
  setStatus: () => {},
  acceptFriendRequest: () => {},
  unfriend: () => {},
});

function SocketProvider({ children }: Readonly<PropsWithChildren>) {
  const socketRef = useRef<TypedSocket | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  const handleUserStatus = useCallback(
    (update: StatusUpdate) => {
      updateFriendPresenceInCache(queryClient, update);
    },
    [queryClient],
  );

  const setTyping = useCallback(
    (receiverId: string, isTyping: boolean) =>
      setTypingAction({ receiverId, isTyping, socketRef }),
    [],
  );

  const sendMessage = useCallback(
    (optimisticMessage: DirectMessage) =>
      sendMessageAction({
        optimisticMessage,
        queryClient,
        socketRef,
        currentUserIdRef,
      }),
    [queryClient],
  );

  const handleDmReceive = useCallback(
    (message: DmReceiveEvent) =>
      handleDMReceiveAction({
        message,
        notificationSound,
        currentUserIdRef,
        queryClient,
      }),
    [notificationSound, queryClient],
  );

  const handleGroupReceive = useCallback(
    (message: GroupReceiveEvent) => {
      setChatMessage<GroupChatPageData>(
        queryClient,
        groupChatKey(message.groupId),
        message,
      );
    },
    [queryClient],
  );

  const handleFriendRequest = useCallback(
    (data: FriendRequestEvent) => {
      upsertPendingFriendRequest(queryClient, data.direction, data.friend);
    },
    [queryClient],
  );

  const handleFriendAccepted = useCallback(
    (data: FriendAcceptedEvent) => {
      removePendingFriendRequest(queryClient, data.direction, data.friend.id);
      upsertFriendInCache(queryClient, data.friend);
    },
    [queryClient],
  );

  const handleFriendRemoved = useCallback(
    (data: FriendRemovedEvent) => {
      removeFriendFromCache(queryClient, data.friendId);
      removePendingFriendRequest(queryClient, "incoming", data.friendId);
      removePendingFriendRequest(queryClient, "outgoing", data.friendId);
    },
    [queryClient],
  );

  const handleProfileUpdate = useCallback(
    (data: ProfileUpdateEvent) => {
      updateFriendProfileInCache(queryClient, data);
    },
    [queryClient],
  );

  useEffect(() => {
    notificationSound.current = new Audio("/sounds/notification.mp3");
    notificationSound.current.volume = 0.5;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        const res = await getWsToken();
        if ("error" in res) return;
        const { token, salt, userId } = res;

        if (cancelled) return;
        currentUserIdRef.current = userId;

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
        );

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

        socket.on("user:status", handleUserStatus);

        socket.on("dm:receive", handleDmReceive);

        socket.on("group:receive", handleGroupReceive);

        socket.on("friend:request", handleFriendRequest);

        socket.on("friend:accepted", handleFriendAccepted);

        socket.on("friend:removed", handleFriendRemoved);

        socket.on("user:profile-update", handleProfileUpdate);

        socketRef.current = socket;
        setIsConnected(socket.connected);
      } catch (error) {
        console.error("Socket initialization error:", error);
      }
    }

    connect();

    return () => {
      cancelled = true;
      currentUserIdRef.current = null;
      socketRef.current?.off();
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [
    queryClient,
    handleUserStatus,
    handleDmReceive,
    handleGroupReceive,
    handleFriendRequest,
    handleFriendAccepted,
    handleFriendRemoved,
    handleProfileUpdate,
  ]);

  const broadcastProfileUpdate = useCallback(
    (data: Omit<ProfileUpdate, "userId">) => {
      socketRef.current?.emit("user:profile-update", data);
    },
    [],
  );

  const sendFriendRequest = useCallback((userName: string) => {
    socketRef.current?.emit("friend:request", { userName }, (response) => {});
  }, []);

  const acceptFriendRequest = useCallback(
    (id: string) => {
      const socket = socketRef.current;

      if (!socket) {
        return;
      }

      const previousFriends =
        queryClient.getQueryData<FriendsPageData>(friendsPageKey);
      const previousPending =
        queryClient.getQueryData<PendingFriendRequestsData>(
          pendingFriendRequestsKey,
        );
      const pendingIncoming = previousPending?.friendRequestsToMe.find(
        (friend) => friend.id === id,
      );

      removePendingFriendRequest(queryClient, "incoming", id);
      if (pendingIncoming) {
        upsertFriendInCache(queryClient, {
          ...pendingIncoming,
          status: "OFFLINE",
        });
      }

      socket.emit("friend:accept", { id }, (response) => {
        if (!response.success) {
          queryClient.setQueryData(friendsPageKey, previousFriends);
          queryClient.setQueryData(pendingFriendRequestsKey, previousPending);
          return;
        }

        queryClient.invalidateQueries({ queryKey: friendsPageKey });
        queryClient.invalidateQueries({ queryKey: pendingFriendRequestsKey });
      });
    },
    [queryClient],
  );

  const unfriend = useCallback(
    (id: string) => {
      return new Promise<FriendRequestActionResult>((resolve) => {
        const socket = socketRef.current;
        if (!socket) {
          resolve({ success: false, error: "Socket unavailable" });
          return;
        }

        const previousFriends =
          queryClient.getQueryData<FriendsPageData>(friendsPageKey);
        const previousPending =
          queryClient.getQueryData<PendingFriendRequestsData>(
            pendingFriendRequestsKey,
          );

        removeFriendFromCache(queryClient, id);
        removePendingFriendRequest(queryClient, "incoming", id);
        removePendingFriendRequest(queryClient, "outgoing", id);

        socket.emit("friend:unfriend", { id }, (response) => {
          if (!response.success) {
            queryClient.setQueryData(friendsPageKey, previousFriends);
            queryClient.setQueryData(pendingFriendRequestsKey, previousPending);
            resolve(response);
            return;
          }

          queryClient.invalidateQueries({ queryKey: friendsPageKey });
          queryClient.invalidateQueries({ queryKey: pendingFriendRequestsKey });
          resolve(response);
        });
      });
    },
    [queryClient],
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

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      isConnected,
      isReconnecting,
      sendMessage,
      setTyping,
      broadcastProfileUpdate,
      sendFriendRequest,
      sendGroupMessage,
      setGroupTyping,
      joinGroup,
      setStatus,
      acceptFriendRequest,
      unfriend,
    }),
    [
      isConnected,
      isReconnecting,
      sendMessage,
      setTyping,
      broadcastProfileUpdate,
      sendFriendRequest,
      sendGroupMessage,
      setGroupTyping,
      joinGroup,
      setStatus,
      acceptFriendRequest,
      unfriend,
    ],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

function useSocketContext() {
  const context = useContext(SocketContext);
  if (context === null)
    throw new Error("SocketContext was used outside of SocketProvider");

  return context;
}

export { SocketProvider, useSocketContext };
