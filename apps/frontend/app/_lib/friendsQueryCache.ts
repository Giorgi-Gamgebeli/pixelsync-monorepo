import { QueryClient } from "@tanstack/react-query";
import type { FriendRequestProfile, UserStatus } from "@repo/types";
import { friendsPageKey } from "./friendsQueryKeys";

type FriendsPageFriend = FriendRequestProfile & {
  status: UserStatus;
};

type FriendsPageData = {
  friends: FriendsPageFriend[];
  pendingFriendRequests: {
    friendRequestsToThem: FriendRequestProfile[];
    friendRequestsToMe: FriendRequestProfile[];
  };
};

function upsertPendingFriendRequest(
  queryClient: QueryClient,
  direction: "incoming" | "outgoing",
  friend: FriendRequestProfile,
) {
  queryClient.setQueryData<FriendsPageData>(friendsPageKey, (prev) => {
    if (!prev) return prev;

    const pending = prev.pendingFriendRequests ?? {
      friendRequestsToThem: [],
      friendRequestsToMe: [],
    };

    if (direction === "incoming") {
      if (pending.friendRequestsToMe.some((item) => item.id === friend.id)) {
        return prev;
      }

      return {
        ...prev,
        pendingFriendRequests: {
          ...pending,
          friendRequestsToMe: [...pending.friendRequestsToMe, friend],
        },
      };
    }

    if (pending.friendRequestsToThem.some((item) => item.id === friend.id)) {
      return prev;
    }

    return {
      ...prev,
      pendingFriendRequests: {
        ...pending,
        friendRequestsToThem: [...pending.friendRequestsToThem, friend],
      },
    };
  });
}

function removePendingFriendRequest(
  queryClient: QueryClient,
  direction: "incoming" | "outgoing",
  friendId: string,
) {
  queryClient.setQueryData<FriendsPageData>(friendsPageKey, (prev) => {
    if (!prev) return prev;

    const pending = prev.pendingFriendRequests ?? {
      friendRequestsToThem: [],
      friendRequestsToMe: [],
    };

    if (direction === "incoming") {
      const nextFriendRequestsToMe = pending.friendRequestsToMe.filter(
        (friend) => friend.id !== friendId,
      );

      if (nextFriendRequestsToMe.length === pending.friendRequestsToMe.length) {
        return prev;
      }

      return {
        ...prev,
        pendingFriendRequests: {
          ...pending,
          friendRequestsToMe: nextFriendRequestsToMe,
        },
      };
    }

    const nextFriendRequestsToThem = pending.friendRequestsToThem.filter(
      (friend) => friend.id !== friendId,
    );

    if (
      nextFriendRequestsToThem.length === pending.friendRequestsToThem.length
    ) {
      return prev;
    }

    return {
      ...prev,
      pendingFriendRequests: {
        ...pending,
        friendRequestsToThem: nextFriendRequestsToThem,
      },
    };
  });
}

export {
  type FriendsPageData,
  type FriendsPageFriend,
  removePendingFriendRequest,
  upsertPendingFriendRequest,
};
