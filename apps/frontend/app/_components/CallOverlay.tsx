"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useCallContext } from "@/app/_context/CallContext";
import UserAvatar from "@/app/_components/UserAvatar";

const PANEL_DEFAULT_OFFSET = 16;
const PANEL_MAX_WIDTH = 420;
const PANEL_MAX_HEIGHT = 360;

function getDefaultPanelPosition(): { x: number; y: number } {
  if (typeof window === "undefined")
    return { x: PANEL_DEFAULT_OFFSET, y: PANEL_DEFAULT_OFFSET };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const panelW = Math.min(PANEL_MAX_WIDTH, w - 2 * PANEL_DEFAULT_OFFSET);
  const panelH = Math.min(PANEL_MAX_HEIGHT, h * 0.6);
  return {
    x: w - panelW - PANEL_DEFAULT_OFFSET,
    y: h - panelH - PANEL_DEFAULT_OFFSET,
  };
}

function AvatarTile({
  userId,
  label,
  className,
}: {
  userId: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 ${className ?? ""}`}
    >
      <UserAvatar id={userId} userName={label} size={80} />
      <span className="rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {label}
      </span>
    </div>
  );
}

function VideoTile({
  stream,
  muted,
  label,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      el.srcObject = stream;
    }
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gray-900 ${className ?? ""}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full object-cover"
      />
      {label && (
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
          {label}
        </span>
      )}
    </div>
  );
}

function CallOverlay() {
  const {
    callState,
    callType,
    localStream,
    remoteStreams,
    audioEnabled,
    videoEnabled,
    remoteMediaState,
    groupParticipants,
    hangup,
    leaveGroupCall,
    toggleMute,
    toggleCamera,
    callUiMode,
    setCallUiMode,
  } = useCallContext();

  const isGroup = groupParticipants.size > 0;
  const isRinging = callState === "ringing-outgoing";
  const isActive = callState === "active";
  const isFull = callUiMode === "full";

  const [panelPosition, setPanelPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isFull) return;
      const clientX = "touches" in e ? e.touches[0]!.clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0]!.clientY : e.clientY;
      const current = panelPosition ?? getDefaultPanelPosition();
      dragRef.current = {
        startX: clientX,
        startY: clientY,
        startLeft: current.x,
        startTop: current.y,
      };
    },
    [isFull, panelPosition],
  );

  useEffect(() => {
    if (isFull) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const clientX = "touches" in e ? e.touches[0]!.clientX! : e.clientX;
      const clientY = "touches" in e ? e.touches[0]!.clientY! : e.clientY;
      let x = d.startLeft + (clientX - d.startX);
      let y = d.startTop + (clientY - d.startY);
      const minVisible = 80;
      x = Math.max(0, Math.min(x, window.innerWidth - minVisible));
      y = Math.max(0, Math.min(y, window.innerHeight - minVisible));
      setPanelPosition({ x, y });
    };
    const onEnd = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isFull]);

  if (!isRinging && !isActive) return null;
  if (callUiMode === "idle" || callUiMode === "mini") return null;

  const remoteEntries = Array.from(remoteStreams.entries());
  const isVideoCall = callType === "video";

  function shouldShowAvatar(userId: string, stream: MediaStream): boolean {
    if (!isVideoCall) return true;
    const remoteVideo = remoteMediaState.get(userId)?.videoEnabled;
    if (remoteVideo === false) return true;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return true;
    if (!videoTracks[0]?.enabled) return true;
    return false;
  }

  const panelStyle =
    !isFull && panelPosition
      ? {
          left: panelPosition.x,
          top: panelPosition.y,
        }
      : undefined;

  const containerClasses = isFull
    ? "fixed inset-0 z-50 flex flex-col bg-gray-950"
    : "fixed z-50 flex h-[min(360px,60vh)] w-[min(420px,100%-2rem)] flex-col overflow-hidden rounded-2xl bg-gray-950 shadow-2xl border border-gray-800";

  const containerStyle = isFull
    ? undefined
    : (panelStyle ?? {
        right: PANEL_DEFAULT_OFFSET,
        bottom: PANEL_DEFAULT_OFFSET,
      });

  return (
    <div className={containerClasses} style={containerStyle}>
      {/* Drag handle (panel mode only) */}
      {!isFull && (
        <div
          role="button"
          tabIndex={0}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onClick={(e) => e.stopPropagation()}
          className="flex cursor-grab items-center justify-center border-b border-gray-800 py-2 text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 active:cursor-grabbing"
          aria-label="Drag to move call panel"
        >
          <Icon icon="mdi:drag" className="text-lg" />
        </div>
      )}
      {/* Video area */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
        {isRinging && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-blue-500/20" />
            <p className="text-lg text-white">Calling...</p>
          </div>
        )}

        {isActive && remoteEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 p-8">
            <div className="h-20 w-20 animate-pulse rounded-full bg-blue-500/20" />
            <p className="text-sm text-gray-400">Connecting...</p>
          </div>
        )}

        {isActive && remoteEntries.length > 0 && (
          <div
            className={`grid h-full w-full gap-2 ${
              remoteEntries.length === 1
                ? "grid-cols-1"
                : remoteEntries.length <= 4
                  ? "grid-cols-2"
                  : "grid-cols-3"
            }`}
          >
            {remoteEntries.map(([userId, stream]) => {
              const displayName = isGroup
                ? (groupParticipants.get(userId) ?? userId)
                : undefined;
              const showAvatar = shouldShowAvatar(userId, stream);
              return showAvatar ? (
                <AvatarTile
                  key={userId}
                  userId={userId}
                  label={displayName ?? userId}
                  className="h-full w-full"
                />
              ) : (
                <VideoTile
                  key={userId}
                  stream={stream}
                  label={displayName}
                  className="h-full w-full"
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Local video PiP */}
      {isVideoCall && localStream && isActive && (
        <VideoTile
          stream={localStream}
          muted
          label="You"
          className={
            isFull
              ? "absolute right-4 bottom-24 h-36 w-28 max-w-[40%]"
              : "absolute right-3 bottom-3 h-24 w-20 max-w-[40%]"
          }
        />
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-3 pb-4">
        <button
          onClick={toggleMute}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
            audioEnabled
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-red-500 text-white hover:bg-red-600"
          }`}
          aria-label={audioEnabled ? "Mute" : "Unmute"}
        >
          <Icon
            icon={audioEnabled ? "mdi:microphone" : "mdi:microphone-off"}
            className="text-xl"
          />
        </button>

        {isVideoCall && (
          <button
            onClick={toggleCamera}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              videoEnabled
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
            aria-label={videoEnabled ? "Camera off" : "Camera on"}
          >
            <Icon
              icon={videoEnabled ? "mdi:video" : "mdi:video-off"}
              className="text-xl"
            />
          </button>
        )}

        <button
          onClick={() => setCallUiMode(isFull ? "panel" : "full")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-200 transition-colors hover:bg-gray-700"
          aria-label={isFull ? "Dock call" : "Maximize call"}
        >
          <Icon
            icon={isFull ? "mdi:dock-bottom" : "mdi:arrow-expand"}
            className="text-xl"
          />
        </button>

        <button
          onClick={isGroup ? leaveGroupCall : hangup}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-105 hover:bg-red-600"
          aria-label="End call"
        >
          <Icon icon="mdi:phone-hangup" className="text-2xl" />
        </button>
      </div>
    </div>
  );
}

export default CallOverlay;
