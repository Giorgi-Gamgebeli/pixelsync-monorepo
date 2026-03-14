import { getRoom } from "@/app/_dataAccessLayer/actions";
import { notFound } from "next/navigation";
import RoomCanvas from "./RoomCanvas";

type Params = {
  params: Promise<{
    projectId: string;
    roomId: string;
  }>;
};

async function Page({ params }: Params) {
  const { projectId, roomId } = await params;

  const room = await getRoom(Number(roomId));

  if (!room || "error" in room) {
    notFound();
  }

  return (
    <RoomCanvas
      roomName={room.title}
      projectId={projectId}
      onlineCount={0}
      onInvite={() => {}}
    />
  );
}

export default Page;
