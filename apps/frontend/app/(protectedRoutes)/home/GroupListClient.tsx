"use client";

import HomeNavLink from "./HomeNavLink";
import ClientIcon from "@/app/_components/ClientIcon";

type Group = {
  id: number;
  name: string;
  _count: { members: number };
};

function GroupListClient({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-gray-500">No groups yet</p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {groups.map((group) => (
        <HomeNavLink key={group.id} href={`/home/group/${group.id}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-semibold text-gray-400">
            {group.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-gray-300">{group.name}</p>
            <p className="truncate text-xs text-gray-500">
              {group._count.members} member{group._count.members !== 1 ? "s" : ""}
            </p>
          </div>
        </HomeNavLink>
      ))}
    </div>
  );
}

export default GroupListClient;
