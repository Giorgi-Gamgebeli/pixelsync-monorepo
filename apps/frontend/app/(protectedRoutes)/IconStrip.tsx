"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/public/noBGLogo.png";
import { Icon } from "@iconify/react/dist/iconify.js";

type IconStripProps = {
  projects:
    | {
        id: number;
        name: string;
      }[]
    | undefined;
};

function IconStrip({ projects }: IconStripProps) {
  const pathname = usePathname();
  const isHome = pathname.startsWith("/home");

  return (
    <div className="scrollbar-thin flex w-icon-strip flex-col items-center gap-2 border-r border-border bg-sidebar py-3">
      {/* Home icon */}
      <Link
        href="/home/friends"
        className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${
          isHome
            ? "bg-brand-500 rounded-xl"
            : "bg-surface hover:bg-surface/80 hover:rounded-xl"
        }`}
      >
        <Image
          src={logo}
          alt="Home"
          height={30}
          width={30}
          className={isHome ? "brightness-0 invert" : ""}
        />
      </Link>

      <div className="mx-auto my-1 w-8 border-b border-border" />

      {/* Project icons */}
      {projects?.map((project) => {
        const isActive = pathname.startsWith(`/project/${project.id}`);
        return (
          <Link
            key={project.id}
            href={`/project/${project.id}`}
            title={project.name}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold transition-all ${
              isActive
                ? "bg-brand-500 rounded-xl text-white"
                : "bg-surface text-gray-400 hover:bg-surface/80 hover:rounded-xl hover:text-white"
            }`}
          >
            {project.name.slice(0, 2).toUpperCase()}
          </Link>
        );
      })}

      {/* Add project button */}
      <Link
        href="/project/create"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-gray-500 transition-all hover:rounded-xl hover:bg-surface/80 hover:text-white"
      >
        <Icon icon="mdi:plus" className="text-2xl" />
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User avatar at bottom */}
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface">
        <Icon icon="mdi:account" className="text-xl text-gray-400" />
      </div>
    </div>
  );
}

export default IconStrip;
