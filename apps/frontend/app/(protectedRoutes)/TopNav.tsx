"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/public/noBGLogo.png";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import UserAvatar from "@/app/_components/UserAvatar";
import AvatarBuilderModal from "@/app/_components/avatar/AvatarBuilderModal";
import ProfileSettingsPanel from "@/app/_components/ProfileSettingsPanel";
import { updateAvatarConfig } from "@/app/_dataAccessLayer/userActions";
import { useSocketContext } from "@/app/_context/SocketContext";

type TopNavProps = {
  projects:
  | {
    id: number;
    name: string;
  }[]
  | undefined;
};

function TopNav({ projects }: TopNavProps) {
  const pathname = usePathname();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const { broadcastProfileUpdate } = useSocketContext();

  const isHome = pathname.startsWith("/home");
  const activeProject = projects?.find((p) =>
    pathname.startsWith(`/project/${p.id}`),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setProjectsOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-secondary px-5">
      {/* Left section */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <Link href="/home/friends" className="flex items-center gap-2.5">
          <Image src={logo} alt="PixelSync" height={26} width={26} />
          <span className="text-sm font-semibold text-white">PixelSync</span>
        </Link>

        {/* Divider */}
        <div className="h-5 w-px bg-border" />

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/home/friends"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isHome
              ? "bg-surface text-white"
              : "text-gray-400 hover:bg-surface/50 hover:text-gray-200"
              }`}
          >
            Home
          </Link>

          {/* Projects dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProjectsOpen(!projectsOpen)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeProject
                ? "bg-surface text-white"
                : "text-gray-400 hover:bg-surface/50 hover:text-gray-200"
                }`}
            >
              {activeProject ? activeProject.name : "Projects"}
              <Icon
                icon="mdi:chevron-down"
                className={`text-base transition-transform ${projectsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {projectsOpen && (
              <div className="absolute top-full left-0 z-50 mt-1.5 w-56 rounded-xl border border-border bg-secondary p-1.5 shadow-xl">
                {projects && projects.length > 0 ? (
                  <>
                    {projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/project/${project.id}`}
                        onClick={() => setProjectsOpen(false)}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${pathname.startsWith(`/project/${project.id}`)
                          ? "bg-brand-500/10 text-brand-400"
                          : "text-gray-300 hover:bg-surface"
                          }`}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface text-xs font-semibold text-gray-400">
                          {project.name.slice(0, 2).toUpperCase()}
                        </div>
                        {project.name}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-border" />
                  </>
                ) : null}
                <Link
                  href="/project/create"
                  onClick={() => setProjectsOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-surface hover:text-gray-200"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-border">
                    <Icon icon="mdi:plus" className="text-base" />
                  </div>
                  New Project
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <Link
          href="/home/friends"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-surface hover:text-gray-200"
          title="Friends"
        >
          <Icon icon="mdi:account-group" className="text-lg" />
        </Link>
        <Link
          href="/home/friends"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-surface hover:text-gray-200"
          title="Messages"
        >
          <Icon icon="mdi:chat" className="text-lg" />
        </Link>

        <div className="ml-1 h-5 w-px bg-border" />

        {/* User profile dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center justify-center rounded-full transition-transform hover:scale-105"
          >
            <UserAvatar
              userName={session?.user?.userName ?? null}
              id={session?.user?.id}
              avatarConfig={session?.user?.avatarConfig}
              size={32}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-secondary p-1.5 shadow-xl z-50">
              <div className="flex items-center gap-2.5 px-3 py-2">
                <UserAvatar
                  userName={session?.user?.userName ?? null}
                  id={session?.user?.id}
                  avatarConfig={session?.user?.avatarConfig}
                  size={28}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {session?.user?.userName || session?.user?.name}
                  </p>
                  <p className="truncate text-[10px] text-gray-500">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => {
                  setProfileOpen(false);
                  setSettingsOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-surface hover:text-white"
              >
                <Icon icon="mdi:cog" className="text-base" />
                Profile Settings
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  setBuilderOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-surface hover:text-white"
              >
                <Icon icon="mdi:pencil" className="text-base" />
                Customize Avatar
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-surface hover:text-red-300"
              >
                <Icon icon="mdi:logout" className="text-base" />
                Sign Out
              </button>
            </div>
          )}
        </div>

        <ProfileSettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onOpenAvatarBuilder={() => {
            setSettingsOpen(false);
            setBuilderOpen(true);
          }}
        />

        <AvatarBuilderModal
          isOpen={builderOpen}
          onClose={() => setBuilderOpen(false)}
          initialConfig={session?.user?.avatarConfig || null}
          userName={session?.user?.userName}
          userId={session?.user?.id}
          onSave={async (config) => {
            await updateAvatarConfig({ avatarConfig: config });
            broadcastProfileUpdate({ avatarConfig: config });
          }}
        />
      </div>
    </nav>
  );
}

export default TopNav;
