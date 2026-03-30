"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useCallContext } from "@/app/_context/CallContext";

function formatDuration(ms: number | null) {
  if (!ms || ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function CallMiniBar() {
  const {
    callState,
    callType,
    callStartedAt,
    callUiMode,
    audioEnabled,
    videoEnabled,
    groupParticipants,
    incomingCall,
    toggleMute,
    toggleCamera,
    hangup,
    leaveGroupCall,
    setCallUiMode,
  } = useCallContext();

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!callStartedAt || callState !== "active") {
      setNow(null);
      return;
    }

    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [callStartedAt, callState]);

  if (callState === "idle") return null;

  const isGroup = groupParticipants.size > 0;
  const isVideo = callType === "video";

  const label =
    callState === "ringing-incoming" && incomingCall
      ? `Incoming ${incomingCall.callType === "video" ? "video" : "voice"} call from ${incomingCall.callerName}`
      : isGroup
        ? `Group call${groupParticipants.size ? ` • ${groupParticipants.size} in call` : ""}`
        : callState === "ringing-outgoing"
          ? "Calling…"
          : "In call";

  const duration =
    callStartedAt && now !== null && callState === "active"
      ? formatDuration(now - callStartedAt)
      : null;

  const handleExpand = () => {
    setCallUiMode(isVideo ? "panel" : "full");
  };

  const handleEnd = () => {
    if (isGroup) {
      leaveGroupCall();
    } else {
      hangup();
    }
  };

  return (
    <div className="pointer-events-auto fixed top-14 right-0 left-0 z-40 flex justify-center">
      <div className="bg-surface/95 border-border flex max-w-xl flex-1 items-center gap-3 rounded-full border px-4 py-2 shadow-lg backdrop-blur">
        <button
          onClick={handleExpand}
          className="flex items-center gap-2 text-xs text-gray-200"
        >
          <div className="bg-brand-500/20 text-brand-400 flex h-7 w-7 items-center justify-center rounded-full">
            <Icon
              icon={isVideo ? "mdi:video" : "mdi:phone"}
              className="text-base"
            />
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[11px] tracking-wide text-gray-400 uppercase">
              {callState === "ringing-outgoing"
                ? "Calling"
                : callState === "ringing-incoming"
                  ? "Incoming call"
                  : "In call"}
            </span>
            <span className="text-xs text-white">{label}</span>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {duration && (
            <span className="text-[11px] text-gray-300 tabular-nums">
              {duration}
            </span>
          )}

          <button
            onClick={toggleMute}
            aria-label={audioEnabled ? "Mute" : "Unmute"}
            className="hover:bg-surface flex h-7 w-7 items-center justify-center rounded-full text-gray-300 transition-colors hover:text-white"
          >
            <Icon
              icon={audioEnabled ? "mdi:microphone" : "mdi:microphone-off"}
              className="text-[15px]"
            />
          </button>

          {isVideo && (
            <button
              onClick={toggleCamera}
              aria-label={videoEnabled ? "Camera off" : "Camera on"}
              className="hover:bg-surface flex h-7 w-7 items-center justify-center rounded-full text-gray-300 transition-colors hover:text-white"
            >
              <Icon
                icon={videoEnabled ? "mdi:video" : "mdi:video-off"}
                className="text-[15px]"
              />
            </button>
          )}

          <button
            onClick={handleEnd}
            aria-label="End call"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-105 hover:bg-red-600"
          >
            <Icon icon="mdi:phone-hangup" className="text-[17px]" />
          </button>

          <button
            onClick={handleExpand}
            aria-label={
              callUiMode === "panel" || callUiMode === "full"
                ? "Focus call"
                : "Open call panel"
            }
            className="hover:bg-surface flex h-7 w-7 items-center justify-center rounded-full text-gray-300 transition-colors hover:text-white"
          >
            <Icon icon="mdi:arrow-expand" className="text-[15px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CallMiniBar;
