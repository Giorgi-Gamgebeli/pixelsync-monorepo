import { getFriends } from "@/app/_dataAccessLayer/userActions";
import FriendItem from "./FriendItem";

async function FriendsList() {
  const result = await getFriends();

  if ("error" in result) {
    return (
      <p className="py-3 text-center text-xs text-gray-500">
        Something went wrong!
      </p>
    );
  }

  const friends = result;

  if (friends.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-gray-500">
        No conversations yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {friends.map((friend) => (
        <FriendItem key={friend.id} friend={friend} />
      ))}
    </div>
  );
}

export default FriendsList;
