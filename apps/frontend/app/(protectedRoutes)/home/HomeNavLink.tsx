"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const resolvedHref = chatView
    ? chatView.type === "dm"
      ? `/home/${chatView.friendId}`
      : `/home/group/${chatView.groupId}`
    : href;

  const isActive =
    !!resolvedHref &&
    (pathname === resolvedHref || pathname.startsWith(resolvedHref + "/"));

  const classes = `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${className ?? ""} ${isActive ? "bg-surface text-white" : "text-gray-400 hover:bg-surface/50 hover:text-gray-200"}`;

  if (!resolvedHref) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <Link href={resolvedHref} className={classes}>
      {children}
    </Link>
  );
}

export default HomeNavLink;
