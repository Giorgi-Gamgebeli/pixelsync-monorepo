"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useCallContext } from "@/app/_context/CallContext";

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
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
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
    groupParticipants,
    hangup,
    leaveGroupCall,
    toggleMute,
    toggleCamera,
  } = useCallContext();

  const isGroup = groupParticipants.size > 0;
  const isRinging = callState === "ringing-outgoing";
  const isActive = callState === "active";

  if (!isRinging && !isActive) return null;

  const remoteEntries = Array.from(remoteStreams.entries());
  const isVideoCall = callType === "video";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
      {/* Video area */}
      <div className="flex flex-1 items-center justify-center p-4">
        {isRinging && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-blue-500/20" />
            <p className="text-lg text-white">Calling...</p>
          </div>
        )}

        {isActive && remoteEntries.length === 0 && (
          <div className="flex flex-col items-center gap-4">
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
            {remoteEntries.map(([userId, stream]) => (
              <VideoTile
                key={userId}
                stream={stream}
                label={
                  isGroup ? (groupParticipants.get(userId) ?? userId) : undefined
                }
                className="h-full w-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* Local video PiP */}
      {isVideoCall && localStream && isActive && (
        <VideoTile
          stream={localStream}
          muted
          label="You"
          className="absolute bottom-24 right-4 h-36 w-28"
        />
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pb-8 pt-4">
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
