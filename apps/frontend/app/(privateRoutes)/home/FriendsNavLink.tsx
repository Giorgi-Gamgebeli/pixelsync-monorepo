"use client";

import ClientIcon from "@/app/_components/ClientIcon";
import { getFriendsPageData } from "@/app/_dataAccessLayer/userActions";
import { usePrefetchQuery } from "@/app/_hooks/usePrefetchQuery";
import { friendsPageKey } from "@/app/_lib/friendsQueryKeys";
import HomeNavLink from "./HomeNavLink";

function FriendsNavLink() {
  const { prefetchQuery } = usePrefetchQuery();

  const prefetch = () => {
    prefetchQuery({
      queryKey: friendsPageKey,
      queryFn: getFriendsPageData,
    });
  };

  return (
    <HomeNavLink href="/home/friends" prefetch={prefetch}>
      <ClientIcon icon="mdi:account-group" className="text-lg" />
      <span>Friends</span>
    </HomeNavLink>
  );
}

export default FriendsNavLink;
