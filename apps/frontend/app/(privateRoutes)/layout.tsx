import { Suspense } from "react";
import TopNavSkeleton from "../_components/skeletons/TopNavSkeleton";
import TopNavWrapper from "./TopNavWrapper";

function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="bg-primary flex h-screen w-full flex-col overflow-hidden">
      <Suspense fallback={<TopNavSkeleton />}>
        <TopNavWrapper />
      </Suspense>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default Layout;
