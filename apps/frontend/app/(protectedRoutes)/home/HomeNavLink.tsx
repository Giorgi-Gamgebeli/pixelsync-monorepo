"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HomeNavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

function HomeNavLink({ children, href, className }: HomeNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${className ?? ""} ${isActive ? "bg-surface text-white" : "text-gray-400 hover:bg-surface/50 hover:text-gray-200"}`}
      href={href}
    >
      {children}
    </Link>
  );
}

export default HomeNavLink;
