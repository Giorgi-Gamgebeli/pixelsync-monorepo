"use client";

import ClientIcon from "@/app/_components/ClientIcon";
import HomeNavLink from "./HomeNavLink";

function FriendsNavLink() {
  return (
    <HomeNavLink href="/home/friends" prefetch={() => {}}>
      <ClientIcon icon="mdi:account-group" className="text-lg" />
      <span>Friends</span>
    </HomeNavLink>
  );
}

export default FriendsNavLink;
