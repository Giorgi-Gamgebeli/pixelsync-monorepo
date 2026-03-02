"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Room = {
  id: string;
  name: string;
  onlineCount?: number;
};

type Member = {
  id: string;
  userName: string | null;
  status: string;
};

type ProjectSidebarProps = {
  projectId: string;
  projectName: string;
  rooms: Room[];
  members: Member[];
  onCreateRoom: () => void;
  onInvite: () => void;
};

function ProjectSidebar({
  projectId,
  projectName,
  rooms,
  members,
  onCreateRoom,
  onInvite,
}: ProjectSidebarProps) {
  const pathname = usePathname();
  const isProjectHome = pathname === `/project/${projectId}`;

  const onlineMembers = members.filter((m) => m.status === "ONLINE");
  const offlineMembers = members.filter((m) => m.status !== "ONLINE");

  return (
    <aside className="scrollbar-thin flex w-64 flex-col border-r border-border bg-secondary/50">
      {/* Project header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="truncate text-sm font-semibold text-white">
          {projectName}
        </h2>
        <button
          onClick={onInvite}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-surface hover:text-gray-300"
          title="Invite members"
        >
          <Icon icon="mdi:account-plus" className="text-base" />
        </button>
      </div>

      {/* Overview link */}
      <div className="px-3">
        <Link
          href={`/project/${projectId}`}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isProjectHome
              ? "bg-surface text-white"
              : "text-gray-400 hover:bg-surface/50 hover:text-gray-200"
          }`}
        >
          <Icon icon="mdi:view-dashboard-outline" className="text-lg" />
          Overview
        </Link>
      </div>

      <div className="mx-3 my-2 border-t border-border/60" />

      {/* Rooms section */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="mb-1 flex items-center justify-between px-2">
          <p className="text-xs font-medium text-gray-500">Rooms</p>
          <button
            onClick={onCreateRoom}
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-gray-500 hover:text-gray-300"
          >
            <Icon icon="mdi:plus" className="text-sm" />
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {rooms.map((room) => {
            const isActive = pathname.includes(`/${room.id}`);
            return (
              <Link
                key={room.id}
                href={`/project/${projectId}/${room.id}`}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-surface text-white font-medium"
                    : "text-gray-400 hover:bg-surface/50 hover:text-gray-200"
                }`}
              >
                <span className="truncate">{room.name}</span>
                {room.onlineCount ? (
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-500">
                      {room.onlineCount}
                    </span>
                  </div>
                ) : null}
              </Link>
            );
          })}

          {rooms.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-500">No rooms yet</p>
          )}
        </div>
      </div>

      {/* Members section */}
      <div className="border-t border-border/60 p-3">
        <p className="mb-2 px-2 text-xs font-medium text-gray-500">
          Members ({members.length})
        </p>
        <div className="flex flex-col gap-1">
          {onlineMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5"
            >
              <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-medium text-gray-300">
                {member.userName?.charAt(0).toUpperCase() || "?"}
                <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-secondary bg-green-500" />
              </div>
              <span className="truncate text-sm text-gray-300">
                {member.userName}
              </span>
            </div>
          ))}
          {offlineMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 opacity-40"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-medium text-gray-400">
                {member.userName?.charAt(0).toUpperCase() || "?"}
              </div>
              <span className="truncate text-sm text-gray-500">
                {member.userName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default ProjectSidebar;
