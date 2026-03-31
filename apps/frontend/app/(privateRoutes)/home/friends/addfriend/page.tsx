import AddFriend from "../AddFriend";
import FriendsHeader from "../FriendsHeader";

function Page() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <FriendsHeader />
      <div className="scrollbar-thin flex-1 overflow-y-auto px-8 py-6">
        <AddFriend />
      </div>
    </div>
  );
}

export default Page;
