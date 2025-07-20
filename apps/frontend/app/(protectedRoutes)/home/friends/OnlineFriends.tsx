"use client";

import { UserStatus } from "@/types";
import Image from "next/image";
import defaultUser from "@/public/default-user.jpg";
import { Icon } from "@iconify/react/dist/iconify.js";
import HomeNavLink from "../HomeNavLink";
import Empty from "@/app/_components/Empty";

type OnlineFriendsProps = {
  friends:
    | {
        id: string;
        userName: string | null;
        image: string | null;
        status: UserStatus;
      }[]
    | undefined;
};

function OnlineFriends({ friends: unsortedFriends }: OnlineFriendsProps) {
  let friends = unsortedFriends?.filter((f) => f.status === "ONLINE");

  if (!friends?.length) return <Empty text="Add friends" />;

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

      <h3 className="my-5">Online - {friends?.length}</h3>

      {friends.map(({ userName, image, status, id }, i) => (
        <HomeNavLink
          href={`/home/${id}`}
          key={i}
          className={`justify-between rounded-none border-t border-gray-300 py-3 hover:rounded-xl hover:border-gray-200 ${
            friends.length === i + 1 ? "" : ""
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
              <span className="text-base">
                {status[0] + status.slice(1).toLowerCase()}
              </span>
            </p>
          </div>

          <div className="flex gap-5 text-gray-700">
            <Icon
              icon="jam:message-alt-f"
              className="rounded-full bg-gray-100 p-2 text-5xl transition-all duration-300 hover:text-gray-900"
            />
            <Icon
              icon="entypo:dots-three-vertical"
              className="rounded-full bg-gray-100 p-2 text-5xl transition-all duration-300 hover:text-gray-900"
            />
          </div>
        </HomeNavLink>
      ))}
    </>
  );
}

export default OnlineFriends;
