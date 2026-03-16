"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatRouter, type SelectedChat } from "./ChatRouterContext";

type HomeNavLinkProps = {
  children: React.ReactNode;
  className?: string;
  chatView?: NonNullable<SelectedChat>;
  href?: string;
};

function HomeNavLink({
  children,
  className,
  chatView,
  href,
}: HomeNavLinkProps) {
  const pathname = usePathname();
  const { selectedChat, selectChat, clearChat } = useChatRouter();

  let isActive: boolean;

  if (chatView) {
    if (!selectedChat || selectedChat.type !== chatView.type) {
      isActive = false;
    } else if (chatView.type === "dm") {
      isActive =
        selectedChat.type === "dm" &&
        selectedChat.friendId === chatView.friendId;
    } else {
      isActive =
        selectedChat.type === "group" &&
        selectedChat.groupId === chatView.groupId;
    }
  } else {
    isActive =
      !selectedChat &&
      !!href &&
      (pathname === href || pathname.startsWith(href + "/"));
  }

  const classes = `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${className ?? ""} ${isActive ? "bg-surface text-white" : "text-gray-400 hover:bg-surface/50 hover:text-gray-200"}`;

  if (chatView) {
    const chatHref =
      chatView.type === "dm"
        ? `/home?dm=${chatView.friendId}`
        : `/home?group=${chatView.groupId}`;

    return (
      <a
        href={chatHref}
        className={classes}
        onClick={(e) => {
          e.preventDefault();
          selectChat(chatView);
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href!} className={classes} onClick={() => clearChat()}>
      {children}
    </Link>
  );
}

export default HomeNavLink;
