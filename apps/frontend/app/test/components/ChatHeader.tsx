import Image from "next/image";

interface ChatHeaderProps {
  currentUser: any;
  onSwitchUser: () => void;
}

export default function ChatHeader({
  currentUser,
  onSwitchUser,
}: ChatHeaderProps) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <Image
        src={currentUser.avatar}
        alt={currentUser.userName}
        width={40}
        height={40}
        className="rounded-full"
      />
      <div>
        <h2 className="font-bold">
          {currentUser.firstName} {currentUser.lastName}
        </h2>
        <p className="text-sm text-gray-600">{currentUser.email}</p>
      </div>
      <button
        onClick={onSwitchUser}
        className="ml-auto rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
      >
        Switch User
      </button>
    </div>
  );
}
