"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserAvatar from "@/app/_components/UserAvatar";

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
  const isProjectChat = pathname === `/project/${projectId}/chat`;

  const onlineMembers = members.filter((m) => m.status === "ONLINE");
  const offlineMembers = members.filter((m) => m.status !== "ONLINE");

  return (
    <aside className="scrollbar-thin border-border bg-secondary/50 flex w-64 flex-col border-r">
      {/* Project header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="truncate text-sm font-semibold text-white">
          {projectName}
        </h2>
        <button
          onClick={onInvite}
          className="hover:bg-surface flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-300"
          title="Invite members"
          aria-label="Invite members"
        >
          <Icon icon="mdi:account-plus" className="text-base" />
        </button>
      </div>

      <div className="px-3 py-2">
        <Link
          href={`/project/${projectId}`}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isProjectHome
              ? "bg-surface text-white"
              : "hover:bg-surface/50 text-gray-400 hover:text-gray-200"
          }`}
        >
          <Icon icon="mdi:view-dashboard-outline" className="text-lg" />
          Overview
        </Link>
        <Link
          href={`/project/${projectId}/chat`}
          className={`mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isProjectChat
              ? "bg-surface text-white"
              : "hover:bg-surface/50 text-gray-400 hover:text-gray-200"
          }`}
        >
          <Icon icon="mdi:chat-outline" className="text-lg" />
          Project Chat
        </Link>
      </div>

      <div className="border-border/60 mx-3 my-2 border-t" />

      {/* Rooms section */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="mb-1 flex items-center justify-between px-2">
          <p className="text-xs font-medium text-gray-500">Rooms</p>
          <button
            onClick={onCreateRoom}
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-gray-500 hover:text-gray-300"
            aria-label="Create room"
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
                    ? "bg-surface font-medium text-white"
                    : "hover:bg-surface/50 text-gray-400 hover:text-gray-200"
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
      <div className="border-border/60 border-t p-3">
        <p className="mb-2 px-2 text-xs font-medium text-gray-500">
          Members ({members.length})
        </p>
        <div className="flex flex-col gap-1">
          {onlineMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5"
            >
              <UserAvatar
                userName={member.userName}
                id={member.id}
                size={24}
                showStatus
                status={member.status}
                statusBorderColor="border-secondary"
              />
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
              <UserAvatar userName={member.userName} id={member.id} size={24} />
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
