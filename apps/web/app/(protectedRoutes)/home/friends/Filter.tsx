"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

function Filter({ pendingFriendRequests }: { pendingFriendRequests: boolean }) {
  const field = "filterBy";
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentFilter = searchParams.get(field) || "online";
  const router = useRouter();
  const params = new URLSearchParams(searchParams);

  function handleClick(value: string) {
    params.set(field, value);

    // history.pushState(null, "", `${pathname}?${params.toString()}`);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <button
        className={`flex cursor-pointer items-center gap-4 rounded-xl px-4 py-2 transition-all duration-300 hover:bg-gray-200 ${"online" === currentFilter ? "pointer-events-none bg-gray-200" : ""}`}
        onClick={() => handleClick("online")}
      >
        Online
      </button>
      <button
        className={`flex cursor-pointer items-center gap-4 rounded-xl px-4 py-2 transition-all duration-300 hover:bg-gray-200 ${"all" === currentFilter ? "pointer-events-none bg-gray-200" : ""}`}
        onClick={() => handleClick("all")}
      >
        All
      </button>
      <button
        className={`flex cursor-pointer items-center gap-4 rounded-xl px-4 py-2 transition-all duration-300 hover:bg-gray-200 ${pendingFriendRequests ? "visible" : "hidden"} ${"pending" === currentFilter ? "pointer-events-none bg-gray-200" : ""}`}
        onClick={() => handleClick("pending")}
      >
        Pending
      </button>
      <button
        className={`hover:bg-brand-600 flex cursor-pointer items-center gap-4 rounded-xl px-4 py-2 transition-all duration-300 ${"addfriend" === currentFilter ? "bg-brand-500/50 text-brand-700 pointer-events-none" : "bg-brand-500 text-white"}`}
        onClick={() => handleClick("addfriend")}
      >
        Add Friend
      </button>
    </>
  );
}

export default Filter;
