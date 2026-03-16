import { Suspense } from "react";
import FriendsList from "./FriendsList";
import GroupList from "./GroupList";
import FriendsListSkeleton from "@/app/_components/skeletons/FriendsListSkeleton";
import HomeNavLink from "./HomeNavLink";
import ClientIcon from "@/app/_components/ClientIcon";
import CreateGroupButton from "./CreateGroupButton";
import { ChatRouterProvider } from "./ChatRouterContext";
import ChatPanel from "./ChatPanel";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChatRouterProvider>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="scrollbar-thin border-border bg-secondary/50 flex w-64 flex-col border-r">
          {/* Search */}
          <div className="p-3">
            <button className="bg-surface/60 hover:bg-surface flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors">
              <ClientIcon icon="mdi:magnify" className="text-lg" />
              Search conversations...
            </button>
          </div>

          {/* Nav */}
          <div className="flex flex-col gap-0.5 px-3">
            <HomeNavLink href="/home/friends">
              <ClientIcon icon="mdi:account-group" className="text-lg" />
              <span>Friends</span>
            </HomeNavLink>
          </div>

          <div className="border-border/60 mx-3 my-2 border-t" />

          {/* DM header */}
          <div className="flex items-center justify-between px-4 pb-1">
            <p className="text-xs font-medium text-gray-500">Direct Messages</p>
          </div>

          {/* DM list */}
          <div className="scrollbar-thin overflow-y-auto px-3 py-1">
            <Suspense fallback={<FriendsListSkeleton />}>
              <FriendsList />
            </Suspense>
          </div>

          <div className="border-border/60 mx-3 my-2 border-t" />

          {/* Group chats header */}
          <div className="flex items-center justify-between px-4 pb-1">
            <p className="text-xs font-medium text-gray-500">Group Chats</p>
            <CreateGroupButton />
          </div>

          {/* Group list */}
          <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-1">
            <Suspense fallback={<FriendsListSkeleton />}>
              <GroupList />
            </Suspense>
          </div>
        </aside>

        {/* Main content */}
        <main className="bg-primary flex min-w-0 flex-1 flex-col overflow-hidden">
          <ChatPanel>{children}</ChatPanel>
        </main>
      </div>
    </ChatRouterProvider>
  );
}

export default Layout;
