import { getFriends } from "@/app/_dataAccessLayer/userActions";
import UserAvatar from "@/app/_components/UserAvatar";
import HomeNavLink from "./HomeNavLink";

async function FriendsList() {
  const result = await getFriends();
  const friends = Array.isArray(result) ? result : [];

  if (friends.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-gray-500">
        No conversations yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {friends.map(({ userName, status, id }) => (
        <HomeNavLink href={`/home/${id}`} key={id}>
          <UserAvatar
            userName={userName}
            id={id}
            size={32}
            showStatus
            status={status}
            statusBorderColor="border-secondary"
          />
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
