"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HomeNavLinkProps = {
  href: string;
  children: React.ReactNode;
  className: string;
};

function HomeNavLink({ children, href, className }: HomeNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      className={`flex items-center gap-4 rounded-2xl px-4 text-xl transition-all duration-300 ${className} ${isActive ? "bg-gray-200" : "hover:bg-gray-200"}`}
      href={href}
    >
      {children}
    </Link>
  );
}

export default HomeNavLink;
