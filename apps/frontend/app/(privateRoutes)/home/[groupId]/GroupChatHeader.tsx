"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { UserStatus } from "@repo/types";
import { useCallContext } from "@/app/_context/CallContext";

type GroupChatHeaderProps = Readonly<{
  group: {
    id: number;
    name: string;
    members: {
      id: string;
      userName: string | null;
      avatarConfig?: string | null;
      status: UserStatus;
    }[];
  };
}>;

function GroupChatHeader({ group }: GroupChatHeaderProps) {
  const {
    joinGroupCall,
    callState,
    setCallUiMode,
    activeGroupCalls,
    activeGroupId,
  } = useCallContext();
  const onlineCount = group.members.filter((m) => m.status === "ONLINE").length;

  const inAnyCall = callState !== "idle";
  const thisGroupHasLiveCall = activeGroupCalls[group.id];
  const weAreInThisGroupCall = activeGroupId === group.id;

  return (
    <div className="border-border flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-gray-400">
          {group.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{group.name}</p>
          <p className="text-xs text-gray-500">
            {group.members.length} member{group.members.length === 1 ? "" : "s"}
            {onlineCount > 0 && ` \u00b7 ${onlineCount} online`}
            {thisGroupHasLiveCall && (
              <>
                {" "}
                ·{" "}
                <span className="text-green-400">
                  {thisGroupHasLiveCall.participantCount} in call
                </span>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {inAnyCall && weAreInThisGroupCall && (
          <button
            onClick={() => setCallUiMode("full")}
            className="hover:bg-surface/60 bg-surface/40 mr-2 flex items-center gap-1 rounded-full px-3 py-1 text-xs text-gray-200 transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <span>In call · Return</span>
          </button>
        )}
        {thisGroupHasLiveCall &&
          !weAreInThisGroupCall &&
          callState === "idle" && (
            <button
              onClick={() => joinGroupCall(group.id, "audio")}
              className="mr-2 flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1.5 text-xs text-green-400 transition-colors hover:bg-green-500/30"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              <span>
                Live call · Join ({thisGroupHasLiveCall.participantCount})
              </span>
            </button>
          )}
        {inAnyCall && !weAreInThisGroupCall && (
          <button
            onClick={() => setCallUiMode("full")}
            className="hover:bg-surface/60 bg-surface/40 mr-2 flex items-center gap-1 rounded-full px-3 py-1 text-xs text-gray-200 transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <span>In call · Return</span>
          </button>
        )}
        <button
          aria-label="Voice call"
          onClick={() => joinGroupCall(group.id, "audio")}
          className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
        >
          <Icon icon="mdi:phone" className="text-lg" />
        </button>
        <button
          aria-label="Video call"
          onClick={() => joinGroupCall(group.id, "video")}
          className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
        >
          <Icon icon="mdi:video" className="text-lg" />
        </button>
        <button
          aria-label="Members"
          className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
        >
          <Icon icon="mdi:account-group" className="text-lg" />
        </button>
      </div>
    </div>
  );
}

export default GroupChatHeader;
