import Image from "next/image";
import defaultUser from "@/public/default-user.jpg";
import {
  getDirectMessages,
  getFriend,
} from "@/app/_dataAcessLayer/userActions";
import Messages from "./Messages";
import { auth } from "@/auth";
import ClientIcon from "@/app/_components/ClientIcon";

export const revalidate = 0;

type Params = {
  params: Promise<{
    friendID: string;
  }>;
};

async function Page({ params }: Params) {
  const { friendID } = await params;
  const [friend, directMessages, session] = await Promise.all([
    getFriend({ id: friendID }),
    getDirectMessages({ id: friendID }),
    auth(),
  ]);

  if (!session) return <div className="p-6 text-gray-400">Loading...</div>;

  if (!friend) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
          <ClientIcon
            icon="mdi:account-off"
            className="text-3xl text-gray-500"
          />
        </div>
        <p className="text-sm font-medium text-white">Friend not found</p>
      </div>
    );
  }

  const { image, status, userName } = friend;
  const isOnline = status === "ONLINE";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image
              fill
              src={image || defaultUser}
              alt={userName || "user"}
              className="rounded-full object-cover"
            />
            {isOnline && (
              <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-primary bg-green-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{userName}</p>
            <p className="text-xs text-gray-500">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-surface hover:text-white">
            <ClientIcon icon="mdi:phone" className="text-lg" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-surface hover:text-white">
            <ClientIcon icon="mdi:dots-vertical" className="text-lg" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <Messages friend={friend} session={session} messages={directMessages} />
      </div>
    </div>
  );
}

export default Page;
