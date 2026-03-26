"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { prefetchDMChat, prefetchGroupChat } from "@/app/_lib/chatQueries";

type ChatTarget =
  | { type: "dm"; friendId: string }
  | { type: "group"; groupId: number };

type HomeNavLinkProps = {
  children: React.ReactNode;
  className?: string;
  chatView?: ChatTarget;
  href?: string;
};

function HomeNavLink({
  children,
  className,
  chatView,
  href,
}: HomeNavLinkProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const resolvedHref = chatView
    ? chatView.type === "dm"
      ? `/home/${chatView.friendId}`
      : `/home/group/${chatView.groupId}`
    : href;

  const isActive =
    !!resolvedHref &&
    (pathname === resolvedHref || pathname.startsWith(resolvedHref + "/"));

  const classes = `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${className ?? ""} ${isActive ? "bg-surface text-white" : "text-gray-400 hover:bg-surface/50 hover:text-gray-200"}`;

  const prefetch = () => {
    if (!chatView) return;

    if (chatView.type === "dm") {
      void prefetchDMChat(queryClient, chatView.friendId);
      return;
    }

    void prefetchGroupChat(queryClient, chatView.groupId);
  };

  if (!resolvedHref) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <Link
      href={resolvedHref}
      className={classes}
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      {children}
    </Link>
  );
}

export default HomeNavLink;
