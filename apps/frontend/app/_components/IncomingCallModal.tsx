"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useCallContext } from "@/app/_context/CallContext";

function IncomingCallModal() {
  const { callState, incomingCall, acceptCall, declineCall } = useCallContext();
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (callState !== "ringing-incoming") {
      setTimeLeft(30);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          declineCall();
          return 30;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [callState, declineCall]);

  if (callState !== "ringing-incoming" || !incomingCall) return null;

  const isVideo = incomingCall.callType === "video";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border-border flex w-80 flex-col items-center gap-6 rounded-2xl border p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
          <Icon
            icon={isVideo ? "mdi:video" : "mdi:phone"}
            className="text-3xl text-blue-400"
          />
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-white">
            {incomingCall.callerName}
          </p>
          <p className="text-sm text-gray-400">
            Incoming {isVideo ? "video" : "voice"} call...
          </p>
          <p className="mt-1 text-xs text-gray-500">{timeLeft}s</p>
        </div>

        <div className="flex gap-6">
          <button
            onClick={declineCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-105 hover:bg-red-600"
            aria-label="Decline call"
          >
            <Icon icon="mdi:phone-hangup" className="text-2xl" />
          </button>
          <button
            onClick={acceptCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white transition-transform hover:scale-105 hover:bg-green-600"
            aria-label="Accept call"
          >
            <Icon icon="mdi:phone" className="text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallModal;
