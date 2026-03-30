import FriendsContent from "./FriendsContent";
import FriendsHeader from "./FriendsHeader";
function Page() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <FriendsHeader />
      <FriendsContent />
    </div>
  );
}

export default Page;
