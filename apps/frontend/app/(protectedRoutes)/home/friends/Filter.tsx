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
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const tabs = [
    { value: "online", label: "Online" },
    { value: "all", label: "All" },
    ...(pendingFriendRequests
      ? [{ value: "pending", label: "Pending" }]
      : []),
  ];

  return (
    <div className="flex items-center gap-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
            tab.value === currentFilter
              ? "bg-surface text-white"
              : "text-gray-400 hover:bg-surface/50 hover:text-gray-200"
          }`}
          onClick={() => handleClick(tab.value)}
        >
          {tab.label}
        </button>
      ))}
      <div className="mx-1 h-5 w-px bg-border" />
      <button
        className={`bg-brand-500 hover:bg-brand-600 cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium text-white transition-colors ${
          "addfriend" === currentFilter ? "bg-brand-600" : ""
        }`}
        onClick={() => handleClick("addfriend")}
      >
        Add Friend
      </button>
    </div>
  );
}

export default Filter;
