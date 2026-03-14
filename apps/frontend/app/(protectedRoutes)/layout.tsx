import { Suspense } from "react";
import TopNavWrapper from "./TopNavWrapper";
import TopNavSkeleton from "../_components/skeletons/TopNavSkeleton";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-primary">
      <Suspense fallback={<TopNavSkeleton />}>
        <TopNavWrapper />
      </Suspense>
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

export default Layout;
