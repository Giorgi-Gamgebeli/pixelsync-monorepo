import { auth } from "@/auth";
import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import TopNavWrapper from "./TopNavWrapper";
import TopNavSkeleton from "../_components/skeletons/TopNavSkeleton";
import SocketWrapper from "./SocketWrapper";

async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <SocketWrapper>
        <div className="bg-primary flex h-screen w-full flex-col overflow-hidden">
          <Suspense fallback={<TopNavSkeleton />}>
            <TopNavWrapper />
          </Suspense>
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </SocketWrapper>
    </SessionProvider>
  );
}

export default Layout;
