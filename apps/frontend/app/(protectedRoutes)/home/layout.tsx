import FriendsList from "./FriendsList";
import HomeNavLink from "./HomeNavLink";
import { Icon } from "@iconify/react/dist/iconify.js";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full grid-cols-[20rem_1fr_1fr] grid-rows-[auto_1fr_1fr] text-[1.4rem]">
      <div className="flex w-full items-center border-b border-gray-300 px-4">
        <button className="my-3 w-full cursor-pointer gap-4 rounded-xl bg-gray-200 px-4 py-2 text-center text-xl">
          Start conversation
        </button>
      </div>
      <div className="row-start-2 -row-end-1 flex flex-col p-3">
        <HomeNavLink href="/home/friends" className="py-3">
          <Icon icon="fa-solid:user-friends" />
          Friends
        </HomeNavLink>

        <div className="mx-auto my-6 w-full max-w-[95%] border-b border-gray-300" />

        <FriendsList />
      </div>
      {children}
    </div>
  );
}

export default layout;
