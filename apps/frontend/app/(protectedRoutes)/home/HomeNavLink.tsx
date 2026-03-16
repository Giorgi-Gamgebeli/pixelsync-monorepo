"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatRouter, parsePathToView } from "./ChatRouterContext";

type HomeNavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

function HomeNavLink({ children, href, className }: HomeNavLinkProps) {
  const pathname = usePathname();
  const { activeView, navigateToChat } = useChatRouter();

  // Determine the "current URL" for active highlighting
  let currentUrl: string;
  if (activeView) {
    currentUrl =
      activeView.type === "dm"
        ? `/home/${activeView.friendId}`
        : `/home/group/${activeView.groupId}`;
  } else {
    currentUrl = pathname;
  }

  const isActive = currentUrl === href || currentUrl.startsWith(href + "/");

  const classes = `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${className ?? ""} ${isActive ? "bg-surface text-white" : "text-gray-400 hover:bg-surface/50 hover:text-gray-200"}`;

  // If the link points to a chat, use client-side navigation
  const targetView = parsePathToView(href);
  if (targetView) {
    return (
      <a
        href={href}
        className={classes}
        onClick={(e) => {
          e.preventDefault();
          navigateToChat(targetView);
        }}
      >
        {children}
      </a>
    );
  }

  // Non-chat links (e.g. Friends) use normal Next.js navigation
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export default HomeNavLink;
