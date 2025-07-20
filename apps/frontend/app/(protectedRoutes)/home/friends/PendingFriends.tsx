"use client";

import defaultUser from "@/public/default-user.jpg";
import { Icon } from "@iconify/react/dist/iconify.js";
import HomeNavLink from "../HomeNavLink";
import Image from "next/image";
import Empty from "@/app/_components/Empty";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
} from "@/app/_dataAcessLayer/userActions";

type PendingFriendsProps = {
  pendingFriendsRequests:
    | {
        friendRequestsToThem: {
          image: string | null;
          userName: string | null;
          name: string | null;
          id: string;
        }[];
        friendRequestsToMe: {
          image: string | null;
          userName: string | null;
          name: string | null;
          id: string;
        }[];
      }
    | undefined;
};

function PendingFriends({ pendingFriendsRequests }: PendingFriendsProps) {
  if (
    !pendingFriendsRequests?.friendRequestsToThem.length &&
    !pendingFriendsRequests?.friendRequestsToMe.length
  )
    return (
      <Empty
        text={`There are no pending friend requests. Click "Add Friend" to send friend
        requests.`}
      />
    );

  const { friendRequestsToThem, friendRequestsToMe } = pendingFriendsRequests;

  return (
    <>
      <div className="relative">
        <input
          placeholder="Search"
          className="w-full rounded-xl border border-gray-300 px-5 py-3"
        />
        <Icon
          icon="mdi-light:magnify"
          className="absolute top-1/2 right-5 -translate-y-1/2 text-4xl text-gray-700"
        />
      </div>

      {friendRequestsToMe.length ? (
        <>
          <h3 className="my-5">Received - {friendRequestsToMe?.length}</h3>

          {friendRequestsToMe.map(({ userName, name, image, id }, i) => (
            <HomeNavLink
              href="#"
              key={i}
              className={`justify-between rounded-none border-t border-gray-300 py-3 hover:rounded-xl hover:border-gray-200 ${
                friendRequestsToMe.length === i + 1 ? "" : ""
              }`}
            >
              <div className="flex gap-5">
                <div className="relative h-12 w-12">
                  <Image
                    fill
                    src={image || defaultUser}
                    alt={`Image of ${userName || "user"}`}
                    className="rounded-full"
                  />
                </div>
                <p className="flex flex-col gap-0 text-gray-700">
                  {userName}
                  <span className="text-base">{name}</span>
                </p>
              </div>

              <div className="flex gap-5 text-gray-700">
                <Icon
                  icon="mdi:check"
                  className="rounded-full bg-gray-100 p-2 text-5xl transition-all duration-300 hover:text-green-600"
                  onClick={async () => acceptFriendRequest({ id })}
                />
                <Icon
                  icon="ic:sharp-close"
                  className="rounded-full bg-gray-100 p-2 text-5xl transition-all duration-300 hover:text-red-600"
                  onClick={async () => declineFriendRequest({ id })}
                />
              </div>
            </HomeNavLink>
          ))}
        </>
      ) : (
        <></>
      )}

      {friendRequestsToThem.length ? (
        <>
          <h3 className="my-5">Sent - {friendRequestsToThem?.length}</h3>

          {friendRequestsToThem.map(({ userName, name, image, id }, i) => (
            <HomeNavLink
              href="#"
              key={i}
              className={`justify-between rounded-none border-t border-gray-300 py-3 hover:rounded-xl hover:border-gray-200 ${
                friendRequestsToThem.length === i + 1 ? "" : ""
              }`}
            >
              <div className="flex gap-5">
                <div className="relative h-12 w-12">
                  <Image
                    fill
                    src={image || defaultUser}
                    alt={`Image of ${userName || "user"}`}
                    className="rounded-full"
                  />
                </div>
                <p className="flex flex-col gap-0 text-gray-700">
                  {userName}
                  <span className="text-base">{name}</span>
                </p>
              </div>

              <Icon
                icon="ic:sharp-close"
                className="rounded-full bg-gray-100 p-2 text-5xl text-gray-700 transition-all duration-300 hover:text-red-600"
                onClick={async () => await cancelFriendRequest({ id })}
              />
            </HomeNavLink>
          ))}
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export default PendingFriends;
