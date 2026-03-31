import Link from "next/link";

function Filter() {
  const tabs = [
    { value: "online", label: "Online" },
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
  ];

  const getHref = (value: string) =>
    value === "online" ? "/home/friends" : `/home/friends?filter=${value}`;

  return (
    <div className="flex items-center gap-1.5">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={getHref(tab.value)}
          className="hover:bg-surface/50 rounded-lg px-3.5 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-200"
        >
          {tab.label}
        </Link>
      ))}
      <div className="bg-border mx-1 h-5 w-px" />
      <Link
        href="/home/friends/addfriend"
        className="bg-brand-500 hover:bg-brand-600 rounded-lg px-3.5 py-1.5 text-sm font-medium text-white transition-colors"
      >
        Add Friend
      </Link>
    </div>
  );
}

export default Filter;
