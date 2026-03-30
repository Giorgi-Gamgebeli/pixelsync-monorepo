import Filter from "./Filter";

function FriendsHeader() {
  return (
    <div className="border-border flex items-center justify-between border-b px-8 py-4">
      <h1 className="text-lg font-semibold text-white">Friends</h1>
      <Filter />
    </div>
  );
}

export default FriendsHeader;
