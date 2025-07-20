import {
  getFriends,
  getPendingFriendRequests,
} from "@/app/_dataAcessLayer/userActions";
import Friends from "./Friends";
import AppHeader from "../../AppHeader";
import Filter from "./Filter";
import { Icon } from "@iconify/react/dist/iconify.js";
import AppMain from "../../AppMain";
import { Suspense } from "react";

export const revalidate = 0;

async function page() {
  const friends = await getFriends();
  const pendingFriendRequests = await getPendingFriendRequests();

  return (
    <>
      <AppHeader>
        <h2 className="flex items-center gap-4">
          <Icon icon="fa-solid:user-friends" />
          Friends
        </h2>
        <Filter
          pendingFriendRequests={
            !!(
              pendingFriendRequests?.friendRequestsToThem.length ||
              pendingFriendRequests?.friendRequestsToMe.length
            )
          }
        />
      </AppHeader>
      <AppMain>
        <div className="h-full w-full px-10 py-5">
          <Suspense fallback={null}>
            <Friends
              pendingFriendsRequests={pendingFriendRequests!}
              friends={friends}
            />
          </Suspense>
        </div>
      </AppMain>
      {/* <div className="col-start-3 col-end-4 row-start-2 -row-end-1"> */}
      {/*   friends activity */}
      {/* </div> */}
    </>
  );
}

export default page;
