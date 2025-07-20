import Image from "next/image";

interface UserSelectionProps {
  users: any[];
  onSelectUser: (user: any) => void;
}

export default function UserSelection({
  users,
  onSelectUser,
}: UserSelectionProps) {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Select a user to start</h1>
      <div className="flex gap-4">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => onSelectUser(u)}
            className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <Image
              src={u.avatar}
              alt={u.userName}
              width={24}
              height={24}
              className="rounded-full"
            />
            Login as {u.firstName}
          </button>
        ))}
      </div>
    </div>
  );
}
