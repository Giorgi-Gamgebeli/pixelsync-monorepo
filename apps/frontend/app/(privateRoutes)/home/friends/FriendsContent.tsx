"use client";

import ClientIcon from "@/app/_components/ClientIcon";
import { getFriendsPageData } from "@/app/_dataAccessLayer/userActions";
import { useQuery } from "@/app/_hooks/useQuery";
import { friendsPageKey } from "@/app/_lib/friendsQueryKeys";
import { useSearchParams } from "next/navigation";
import FriendsContentSkeleton from "./FriendsContentSkeleton";
import FriendsPage from "./FriendsPage";

function FriendsContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const activeFilter =
    filter === "all" || filter === "pending" ? filter : "online";

  const { data, error, isPending } = useQuery({
    queryKey: friendsPageKey,
    queryFn: getFriendsPageData,
  });

  if (isPending && !data) {
    return <FriendsContentSkeleton />;
  }

  if (error || !data || "error" in data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 py-6">
        <div className="bg-surface flex h-14 w-14 items-center justify-center rounded-2xl">
          <ClientIcon
            icon="mdi:account-group-outline"
            className="text-3xl text-gray-500"
          />
        </div>
        <p className="text-sm font-medium text-white">Friends unavailable</p>
        <p className="text-sm text-gray-500">
          We couldn&apos;t load your friends list right now.
        </p>
      </div>
    );
  }

  return <FriendsPage activeFilter={activeFilter} friends={data.friends} />;
}

export default FriendsContent;
