"use client";

import HomeNavLink from "./HomeNavLink";
import { useCallContext } from "@/app/_context/CallContext";

type Group = {
  id: number;
  name: string;
  _count: { members: number };
};

function GroupListClient({ groups }: { groups: Group[] }) {
  const { activeGroupCalls } = useCallContext();

  if (groups.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-gray-500">No groups yet</p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {groups.map((group) => {
        const liveCall = activeGroupCalls[group.id];
        return (
          <HomeNavLink key={group.id} href={`/home/group/${group.id}`}>
            <div className="bg-surface relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-gray-400">
              {group.name.slice(0, 2).toUpperCase()}
              {liveCall && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500"
                  title={`${liveCall.participantCount} in call`}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-gray-300">{group.name}</p>
              <p className="truncate text-xs text-gray-500">
                {group._count.members} member
                {group._count.members !== 1 ? "s" : ""}
                {liveCall && (
                  <span className="text-green-400">
                    {" "}
                    · {liveCall.participantCount} in call
                  </span>
                )}
              </p>
            </div>
          </HomeNavLink>
        );
      })}
    </div>
  );
}

export default GroupListClient;
