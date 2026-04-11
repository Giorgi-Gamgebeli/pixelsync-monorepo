"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { useSocketContext } from "@/app/_context/SocketContext";
import UserAvatar from "@/app/_components/UserAvatar";
import {
  cancelFriendRequest,
  declineFriendRequest,
  getPendingFriendRequests,
} from "@/app/_dataAccessLayer/userActions";
import { useQuery } from "@/app/_hooks/useQuery";
import {
  friendsPageKey,
  pendingFriendRequestsKey,
} from "@/app/_lib/friendsQueryKeys";

function PendingFriends() {
  const { acceptFriendRequest: acceptFriendRequestSocket } = useSocketContext();
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isPending: isRequestsPending,
  } = useQuery({
    queryKey: pendingFriendRequestsKey,
    queryFn: getPendingFriendRequests,
  });

  if (isRequestsPending && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-surface mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Icon icon="mdi:inbox" className="text-3xl text-gray-500" />
        </div>
        <p className="text-sm font-medium text-white">
          Loading pending requests
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Give us a second while we fetch them.
        </p>
      </div>
    );
  }

  if (
    error ||
    !data ||
    "error" in data ||
    (!data.friendRequestsToThem.length && !data.friendRequestsToMe.length)
  ) {
    if (error || !data || "error" in data) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-surface mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
            <Icon
              icon="mdi:alert-circle-outline"
              className="text-3xl text-gray-500"
            />
          </div>
          <p className="text-sm font-medium text-white">
            Pending requests unavailable
          </p>
          <p className="mt-1 text-sm text-gray-500">
            We couldn&apos;t load pending requests right now.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-surface mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Icon icon="mdi:inbox" className="text-3xl text-gray-500" />
        </div>
        <p className="text-sm font-medium text-white">
          No pending friend requests
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Click &quot;Add Friend&quot; to send friend requests.
        </p>
      </div>
    );
  }

  const { friendRequestsToThem, friendRequestsToMe } = data;

  return (
    <div>
      {friendRequestsToMe.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-gray-500">
            Received &mdash; {friendRequestsToMe.length}
          </p>
          <div className="flex flex-col">
            {friendRequestsToMe.map(({ userName, id, avatarConfig }) => (
              <div
                key={id}
                className="group hover:bg-surface flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    userName={userName}
                    id={id}
                    avatarConfig={avatarConfig}
                    size={40}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Incoming Friend Request
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="bg-surface flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-green-500/20 hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = acceptFriendRequestSocket(id);
                      })
                    }
                  >
                    <Icon icon="mdi:check" className="text-lg" />
                  </button>
                  <button
                    className="bg-surface flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await declineFriendRequest({ id });
                        if (result?.error) return;
                        queryClient.invalidateQueries({
                          queryKey: friendsPageKey,
                        });
                        queryClient.invalidateQueries({
                          queryKey: pendingFriendRequestsKey,
                        });
                      })
                    }
                  >
                    <Icon icon="mdi:close" className="text-lg" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {friendRequestsToThem.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-500">
            Sent &mdash; {friendRequestsToThem.length}
          </p>
          <div className="flex flex-col">
            {friendRequestsToThem.map(({ userName, id, avatarConfig }) => (
              <div
                key={id}
                className="group hover:bg-surface flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    userName={userName}
                    id={id}
                    avatarConfig={avatarConfig}
                    size={40}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Outgoing Friend Request
                    </p>
                  </div>
                </div>

                <button
                  className="bg-surface flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await cancelFriendRequest({ id });
                      if (result?.error) return;
                      queryClient.invalidateQueries({
                        queryKey: pendingFriendRequestsKey,
                      });
                    })
                  }
                >
                  <Icon icon="mdi:close" className="text-lg" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingFriends;
