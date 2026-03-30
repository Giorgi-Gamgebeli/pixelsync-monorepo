"use client";

import { SocketProvider } from "@/app/_context/SocketContext";
import { type PropsWithChildren } from "react";
import CallMiniBar from "../_components/CallMiniBar";
import CallOverlay from "../_components/CallOverlay";
import IncomingCallModal from "../_components/IncomingCallModal";
import { CallProvider } from "../_context/CallContext";

function SocketWrapper({ children }: Readonly<PropsWithChildren>) {
  return (
    <SocketProvider>
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
