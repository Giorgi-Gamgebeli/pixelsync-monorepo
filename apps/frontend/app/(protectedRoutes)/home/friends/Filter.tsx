"use client";

type FilterProps = {
  activeFilter: string;
  onFilterChange: (value: string) => void;
  pendingFriendRequests: boolean;
};

function Filter({
  activeFilter,
  onFilterChange,
  pendingFriendRequests,
}: FilterProps) {
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
            tab.value === activeFilter
              ? "bg-surface text-white"
              : "text-gray-400 hover:bg-surface/50 hover:text-gray-200"
          }`}
          onClick={() => onFilterChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
      <div className="mx-1 h-5 w-px bg-border" />
      <button
        className={`bg-brand-500 hover:bg-brand-600 cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium text-white transition-colors ${
          "addfriend" === activeFilter ? "bg-brand-600" : ""
        }`}
        onClick={() => onFilterChange("addfriend")}
      >
        Add Friend
      </button>
    </div>
  );
}

export default Filter;
