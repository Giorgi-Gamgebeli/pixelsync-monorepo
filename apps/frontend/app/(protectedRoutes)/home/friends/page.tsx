import {
  getFriends,
  getPendingFriendRequests,
} from "@/app/_dataAccessLayer/userActions";
import FriendsPage from "./FriendsPage";

export const revalidate = 0;

async function Page() {
  const [friendsResult, pendingResult] = await Promise.all([
    getFriends(),
    getPendingFriendRequests(),
  ]);

  const friends = Array.isArray(friendsResult) ? friendsResult : [];
  const pendingFriendRequests =
    pendingResult && "friendRequestsToThem" in pendingResult
      ? pendingResult
      : undefined;

  return (
    <FriendsPage
      friends={friends}
      pendingFriendRequests={pendingFriendRequests}
    />
  );
}

export default Page;
