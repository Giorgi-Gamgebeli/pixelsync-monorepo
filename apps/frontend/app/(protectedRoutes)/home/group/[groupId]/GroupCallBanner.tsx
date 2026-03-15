"use client";

import { useCallContext } from "@/app/_context/CallContext";

type GroupCallBannerProps = {
  groupId: number;
  groupName: string;
};

function GroupCallBanner({ groupId, groupName }: GroupCallBannerProps) {
  const { activeGroupCalls, activeGroupId, joinGroupCall } = useCallContext();

  const liveCall = activeGroupCalls[groupId];
  const weAreInThisCall = activeGroupId === groupId;

  if (!liveCall || weAreInThisCall) return null;

  return (
    <div className="border-border bg-green-500/10 flex items-center justify-center gap-2 border-b px-4 py-2">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      <span className="text-sm text-gray-200">
        {liveCall.participantCount} {liveCall.participantCount === 1 ? "person" : "people"} in a call
      </span>
      <button
        type="button"
        onClick={() => joinGroupCall(groupId, "audio")}
        className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
      >
        Join call
      </button>
    </div>
  );
}

export default GroupCallBanner;
