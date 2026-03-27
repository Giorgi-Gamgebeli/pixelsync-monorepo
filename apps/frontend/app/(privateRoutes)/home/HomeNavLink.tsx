"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HomeNavLinkProps = Readonly<{
  children: React.ReactNode;
  href: string;
  prefetch: () => void;
}>;

function HomeNavLink({ children, href, prefetch }: HomeNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-surface text-white" : "hover:bg-surface/50 text-gray-400 hover:text-gray-200"}`}
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      {children}
    </Link>
  );
}

export default HomeNavLink;
