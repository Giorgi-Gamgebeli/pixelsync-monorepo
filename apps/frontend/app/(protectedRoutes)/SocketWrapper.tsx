"use client";

import { type PropsWithChildren } from "react";
import { useSession } from "next-auth/react";
import { SocketProvider } from "@/app/_context/SocketContext";

function SocketWrapper({ children }: PropsWithChildren) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  if (!userId) return children;

  return <SocketProvider userId={userId}>{children}</SocketProvider>;
}

export default SocketWrapper;
