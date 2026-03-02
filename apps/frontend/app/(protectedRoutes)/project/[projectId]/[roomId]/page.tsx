import RoomCanvas from "./RoomCanvas";

type Params = {
  params: Promise<{
    projectId: string;
    roomId: string;
  }>;
};

async function Page({ params }: Params) {
  const { projectId, roomId } = await params;

  // TODO: Fetch room data from database
  const roomName = "Wireframes";
  const onlineCount = 2;

  return (
    <RoomCanvas
      roomName={roomName}
      projectId={projectId}
      onlineCount={onlineCount}
      onInvite={() => {}}
    />
  );
}

export default Page;
