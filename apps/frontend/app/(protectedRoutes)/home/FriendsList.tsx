import { getFriends } from "@/app/_dataAcessLayer/userActions";
import Image from "next/image";
import defaultUser from "@/public/default-user.jpg";
import HomeNavLink from "./HomeNavLink";

async function FriendsList() {
  const friends = await getFriends();
  return (
    <div className="row-span-full flex flex-col gap-2">
      {friends ? (
        <>
          {friends.map(({ userName, image, status, id }, i) => (
            <HomeNavLink href={`/home/${id}`} key={i} className="py-1">
              <div className="relative h-10 w-10">
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
                  {status.slice(0, 1) + status.slice(1).toLowerCase()}
                </span>
              </p>
            </HomeNavLink>
          ))}
        </>
      ) : (
        <></>
      )}
    </div>
  );
}

export default FriendsList;
