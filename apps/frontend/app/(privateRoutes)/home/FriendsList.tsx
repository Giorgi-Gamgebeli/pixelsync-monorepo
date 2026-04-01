"use client";

import FriendItem from "./FriendItem";
import FriendsListSkeleton from "@/app/_components/skeletons/FriendsListSkeleton";
import { getFriendsPageData } from "@/app/_dataAccessLayer/userActions";
import { useQuery } from "@/app/_hooks/useQuery";
import { friendsPageKey } from "@/app/_lib/friendsQueryKeys";

function FriendsList() {
  const { data, error, isPending } = useQuery({
    queryKey: friendsPageKey,
    queryFn: getFriendsPageData,
  });

  if (isPending && !data) {
    return <FriendsListSkeleton />;
  }

  if (error || !data || "error" in data) {
    return (
      <p className="py-3 text-center text-xs text-gray-500">
        Something went wrong!
      </p>
    );
  }

  const friends = data.friends;

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
