import { getFriends } from "@/app/_dataAccessLayer/userActions";
import FriendsListClient from "./FriendsListClient";

async function FriendsList() {
  const result = await getFriends();
  const friends = Array.isArray(result) ? result : [];

  return <FriendsListClient friends={friends} />;
}

export default FriendsList;
