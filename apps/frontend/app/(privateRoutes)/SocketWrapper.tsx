"use client";

import { type PropsWithChildren } from "react";
import { useSession } from "next-auth/react";
import { SocketProvider } from "@/app/_context/SocketContext";
import { CallProvider } from "@/app/_context/CallContext";
import IncomingCallModal from "@/app/_components/IncomingCallModal";
import CallOverlay from "@/app/_components/CallOverlay";
import CallMiniBar from "@/app/_components/CallMiniBar";

function SocketWrapper({ children }: PropsWithChildren) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  if (!userId) return children;

  return (
    <SocketProvider userId={userId}>
      <CallProvider>
        {children}
        <IncomingCallModal />
        <CallOverlay />
        <CallMiniBar />
      </CallProvider>
    </SocketProvider>
  );
}

export default SocketWrapper;
