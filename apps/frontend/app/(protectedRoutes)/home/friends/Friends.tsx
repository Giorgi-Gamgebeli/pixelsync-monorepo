"use client";

import { useSearchParams } from "next/navigation";
import AddFriend from "./AddFriend";
import AllFriends from "./AllFriends";
import { UserStatus } from "@/types";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { changeHeading, changeIcon } from "@/app/_redux/layoutSlice";
import PendingFriends from "./PendingFriends";
import OnlineFriends from "./OnlineFriends";

type FriendsProps = {
  friends:
    | {
        id: string;
        userName: string | null;
        image: string | null;
        status: UserStatus;
      }[]
    | undefined;
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

function Friends({ friends, pendingFriendsRequests }: FriendsProps) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(changeHeading("Friends"));
    dispatch(changeIcon("fa-solid:user-friends"));
  }, []);

  const searchParams = useSearchParams();
  const filterBy = searchParams.get("filterBy") || "online";

  if (filterBy === "addfriend") return <AddFriend />;

  if (filterBy === "pending")
    return <PendingFriends pendingFriendsRequests={pendingFriendsRequests} />;

  if (filterBy == "all") return <AllFriends friends={friends} />;

  return <OnlineFriends friends={friends} />;
}

export default Friends;
