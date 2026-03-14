import { Suspense } from "react";
import TopNavWrapper from "./TopNavWrapper";
import TopNavSkeleton from "../_components/skeletons/TopNavSkeleton";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col bg-primary overflow-hidden">
      <Suspense fallback={<TopNavSkeleton />}>
        <TopNavWrapper />
      </Suspense>
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}

export default Layout;
