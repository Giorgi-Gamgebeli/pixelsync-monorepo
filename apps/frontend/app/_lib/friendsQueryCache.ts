import { QueryClient } from "@tanstack/react-query";
import type {
  FriendRequestProfile,
  ProfileUpdate,
  UserStatus,
} from "@repo/types";
import { friendsPageKey, pendingFriendRequestsKey } from "./friendsQueryKeys";
import { sortFriendsByLastMessageAt, toTimestamp } from "./friendsSorting";

export type FriendsPageFriend = {
  id: string;
  userName: string | null;
  status: UserStatus;
  avatarConfig?: string | null;
  name?: string | null;
  lastMessageAt?: string | null;
};

type FriendRequestItem = {
  id: string;
  userName: string | null;
  name?: string | null;
  avatarConfig?: string | null;
};

type FriendsPageData = {
  friends: FriendsPageFriend[];
};

type PendingFriendRequestsData = {
  friendRequestsToThem: FriendRequestItem[];
  friendRequestsToMe: FriendRequestItem[];
};

type UpsertFriendInput = FriendRequestItem & {
  status?: UserStatus;
};

function patchFriendProfile<
  T extends {
    id: string;
    userName: string | null;
    avatarConfig?: string | null;
  },
>(friend: T, update: ProfileUpdate) {
  return {
    ...friend,
    userName: update.userName === undefined ? friend.userName : update.userName,
    avatarConfig:
      update.avatarConfig === undefined
        ? friend.avatarConfig
        : update.avatarConfig,
  };
}

function patchFriendRequestProfile<T extends FriendRequestItem>(
  friend: T,
  update: ProfileUpdate,
) {
  return {
    ...friend,
    userName: update.userName === undefined ? friend.userName : update.userName,
    name: update.name === undefined ? friend.name : update.name,
    avatarConfig:
      update.avatarConfig === undefined
        ? friend.avatarConfig
        : update.avatarConfig,
  };
}

function upsertPendingFriendRequest(
  queryClient: QueryClient,
  direction: "incoming" | "outgoing",
  friend: FriendRequestProfile,
) {
  queryClient.setQueryData<PendingFriendRequestsData>(
    pendingFriendRequestsKey,
    (prev) => {
      const pending = prev ?? {
        friendRequestsToThem: [],
        friendRequestsToMe: [],
      };

      if (direction === "incoming") {
        if (pending.friendRequestsToMe.some((item) => item.id === friend.id)) {
          return pending;
        }

        return {
          ...pending,
          friendRequestsToMe: [...pending.friendRequestsToMe, friend],
        };
      }

      if (pending.friendRequestsToThem.some((item) => item.id === friend.id)) {
        return pending;
      }

      return {
        ...pending,
        friendRequestsToThem: [...pending.friendRequestsToThem, friend],
      };
    },
  );
}

function removePendingFriendRequest(
  queryClient: QueryClient,
  direction: "incoming" | "outgoing",
  friendId: string,
) {
  queryClient.setQueryData<PendingFriendRequestsData>(
    pendingFriendRequestsKey,
    (prev) => {
      if (!prev) return prev;

      if (direction === "incoming") {
        const nextFriendRequestsToMe = prev.friendRequestsToMe.filter(
          (friend) => friend.id !== friendId,
        );

        if (nextFriendRequestsToMe.length === prev.friendRequestsToMe.length) {
          return prev;
        }

        return {
          ...prev,
          friendRequestsToMe: nextFriendRequestsToMe,
        };
      }

      const nextFriendRequestsToThem = prev.friendRequestsToThem.filter(
        (friend) => friend.id !== friendId,
      );

      if (
        nextFriendRequestsToThem.length === prev.friendRequestsToThem.length
      ) {
        return prev;
      }

      return {
        ...prev,
        friendRequestsToThem: nextFriendRequestsToThem,
      };
    },
  );
}

function updateFriendPresenceInCache(
  queryClient: QueryClient,
  update: { userId: string; status: UserStatus },
) {
  queryClient.setQueryData<FriendsPageData>(friendsPageKey, (prev) => {
    if (!prev) return prev;

    let changed = false;
    const friends = prev.friends.map((friend) => {
      if (friend.id !== update.userId) return friend;
      changed = true;
      return { ...friend, status: update.status };
    });

    if (!changed) return prev;

    return {
      ...prev,
      friends,
    };
  });
}

function updateFriendProfileInCache(
  queryClient: QueryClient,
  update: ProfileUpdate,
) {
  queryClient.setQueryData<FriendsPageData>(friendsPageKey, (prev) => {
    if (!prev) return prev;

    let changed = false;
    const friends = prev.friends.map((friend) => {
      if (friend.id !== update.userId) return friend;
      changed = true;
      return patchFriendProfile(friend, update);
    });

    if (!changed) return prev;

    return {
      ...prev,
      friends,
    };
  });

  queryClient.setQueryData<PendingFriendRequestsData>(
    pendingFriendRequestsKey,
    (prev) => {
      if (!prev) return prev;

      let changed = false;
      const friendRequestsToThem = prev.friendRequestsToThem.map((friend) => {
        if (friend.id !== update.userId) return friend;
        changed = true;
        return patchFriendRequestProfile(friend, update);
      });
      const friendRequestsToMe = prev.friendRequestsToMe.map((friend) => {
        if (friend.id !== update.userId) return friend;
        changed = true;
        return patchFriendRequestProfile(friend, update);
      });

      if (!changed) return prev;

      return {
        ...prev,
        friendRequestsToThem,
        friendRequestsToMe,
      };
    },
  );
}

function updateFriendLastMessageInCache(
  queryClient: QueryClient,
  friendId: string,
  lastMessageAt: string,
) {
  const incomingTimestamp = toTimestamp(lastMessageAt);
  if (!incomingTimestamp) return;

  queryClient.setQueryData<FriendsPageData>(friendsPageKey, (prev) => {
    if (!prev) return prev;

    let changed = false;
    const friends = prev.friends.map((friend) => {
      if (friend.id !== friendId) return friend;

      if (incomingTimestamp <= toTimestamp(friend.lastMessageAt ?? null)) {
        return friend;
      }

      changed = true;
      return {
        ...friend,
        lastMessageAt,
      };
    });

    if (!changed) return prev;

    return {
      ...prev,
      friends: sortFriendsByLastMessageAt(friends),
    };
  });
}

function upsertFriendInCache(queryClient: QueryClient, friend: UpsertFriendInput) {
  queryClient.setQueryData<FriendsPageData>(friendsPageKey, (prev) => {
    if (!prev) return prev;

    const existing = prev.friends.find((item) => item.id === friend.id);

    if (!existing) {
      return {
        ...prev,
        friends: sortFriendsByLastMessageAt([
          ...prev.friends,
          {
            id: friend.id,
            userName: friend.userName,
            name: friend.name,
            avatarConfig: friend.avatarConfig,
            status: friend.status ?? "OFFLINE",
            lastMessageAt: null,
          },
        ]),
      };
    }

    const nextFriends = prev.friends.map((item) => {
      if (item.id !== friend.id) return item;

      return {
        ...item,
        userName: friend.userName ?? item.userName,
        name: friend.name ?? item.name,
        avatarConfig:
          friend.avatarConfig === undefined
            ? item.avatarConfig
            : friend.avatarConfig,
        status: friend.status ?? item.status,
      };
    });

    return {
      ...prev,
      friends: nextFriends,
    };
  });
}

function removeFriendFromCache(queryClient: QueryClient, friendId: string) {
  queryClient.setQueryData<FriendsPageData>(friendsPageKey, (prev) => {
    if (!prev) return prev;

    const nextFriends = prev.friends.filter((friend) => friend.id !== friendId);
    if (nextFriends.length === prev.friends.length) return prev;

    return {
      ...prev,
      friends: nextFriends,
    };
  });
}

export {
  type FriendsPageData,
  type PendingFriendRequestsData,
  removeFriendFromCache,
  removePendingFriendRequest,
  upsertFriendInCache,
  updateFriendLastMessageInCache,
  updateFriendPresenceInCache,
  updateFriendProfileInCache,
  upsertPendingFriendRequest,
};
