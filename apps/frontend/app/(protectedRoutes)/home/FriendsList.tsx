import { getFriends } from "@/app/_dataAcessLayer/userActions";
import Image from "next/image";
import defaultUser from "@/public/default-user.jpg";
import HomeNavLink from "./HomeNavLink";

async function FriendsList() {
  const friends = await getFriends();

  if (!friends || friends.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-gray-500">
        No conversations yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {friends.map(({ userName, image, status, id }) => (
        <HomeNavLink href={`/home/${id}`} key={id}>
          <div className="relative h-8 w-8 shrink-0">
            <Image
              fill
              src={image || defaultUser}
              alt={`${userName || "user"}`}
              className="rounded-full object-cover"
            />
            {status === "ONLINE" && (
              <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-secondary bg-green-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-gray-300">{userName}</p>
            <p className="truncate text-xs text-gray-500">
              {status === "ONLINE" ? "Online" : "Offline"}
            </p>
          </div>
        </HomeNavLink>
      ))}
    </div>
  );
}

export default FriendsList;
