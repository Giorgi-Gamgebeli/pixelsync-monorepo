"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useTransition } from "react";
import UserAvatar from "@/app/_components/UserAvatar";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
} from "@/app/_dataAccessLayer/userActions";

type PendingFriendsProps = {
  pendingFriendsRequests:
  | {
    friendRequestsToThem: {
      userName: string | null;
      name: string | null;
      id: string;
      avatarConfig?: string | null;
    }[];
    friendRequestsToMe: {
      userName: string | null;
      name: string | null;
      id: string;
      avatarConfig?: string | null;
    }[];
  }
  | undefined;
};

function PendingFriends({ pendingFriendsRequests }: PendingFriendsProps) {
  const [isPending, startTransition] = useTransition();

  if (
    !pendingFriendsRequests?.friendRequestsToThem.length &&
    !pendingFriendsRequests?.friendRequestsToMe.length
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
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

  const { friendRequestsToThem, friendRequestsToMe } = pendingFriendsRequests;

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
                className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar userName={userName} id={id} avatarConfig={avatarConfig} size={40} />
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
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface text-gray-400 transition-colors hover:bg-green-500/20 hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await acceptFriendRequest({ id });
                      })
                    }
                  >
                    <Icon icon="mdi:check" className="text-lg" />
                  </button>
                  <button
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await declineFriendRequest({ id });
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
                className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar userName={userName} id={id} avatarConfig={avatarConfig} size={40} />
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
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await cancelFriendRequest({ id });
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
