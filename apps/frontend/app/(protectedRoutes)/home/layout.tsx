import FriendsList from "./FriendsList";
import HomeNavLink from "./HomeNavLink";
import ClientIcon from "@/app/_components/ClientIcon";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="scrollbar-thin flex w-64 flex-col border-r border-border bg-secondary/50">
        {/* Search */}
        <div className="p-3">
          <button className="flex w-full items-center gap-2 rounded-lg bg-surface/60 px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-surface">
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

        <div className="mx-3 my-2 border-t border-border/60" />

        {/* DM header */}
        <div className="flex items-center justify-between px-4 pb-1">
          <p className="text-xs font-medium text-gray-500">
            Direct Messages
          </p>
        </div>

        {/* DM list */}
        <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-1">
          <FriendsList />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden bg-primary">
        {children}
      </main>
    </div>
  );
}

export default Layout;
