import { Suspense } from "react";
import TopNavWrapper from "./TopNavWrapper";
import TopNavSkeleton from "../_components/skeletons/TopNavSkeleton";
import SocketWrapper from "./SocketWrapper";

function Layout({ children }: { children: React.ReactNode }) {
  return (
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
  );
}

export default Layout;
