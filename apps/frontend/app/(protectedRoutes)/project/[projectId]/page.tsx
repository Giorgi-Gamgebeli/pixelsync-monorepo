import ClientIcon from "@/app/_components/ClientIcon";
import Link from "next/link";

type Params = {
  params: Promise<{
    projectId: string;
  }>;
};

async function Page({ params }: Params) {
  const { projectId } = await params;

  // TODO: Fetch rooms from database
  const rooms = [
    { id: "room-1", name: "Wireframes", onlineCount: 3 },
    { id: "room-2", name: "Architecture", onlineCount: 0 },
    { id: "room-3", name: "Logo Ideas", onlineCount: 1 },
  ];

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Rooms</h1>
        <p className="mt-1 text-sm text-gray-500">
          Jump into a room to start collaborating on the canvas.
        </p>
      </div>

      {rooms.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
            <ClientIcon
              icon="mdi:artboard"
              className="text-3xl text-gray-500"
            />
          </div>
          <p className="text-sm font-medium text-white">No rooms yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create your first room to start designing together.
          </p>
        </div>
      ) : (
        /* Room card grid */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/project/${projectId}/${room.id}`}
              className="group rounded-xl border border-border bg-secondary/50 p-1 transition-all hover:border-border hover:bg-secondary"
            >
              {/* Canvas preview placeholder */}
              <div className="flex h-36 items-center justify-center rounded-lg bg-surface/50">
                <ClientIcon
                  icon="mdi:artboard"
                  className="text-4xl text-gray-600 transition-colors group-hover:text-gray-500"
                />
              </div>

              {/* Card info */}
              <div className="flex items-center justify-between px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-200 group-hover:text-white">
                    {room.name}
                  </p>
                </div>
                {room.onlineCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-500">
                      {room.onlineCount}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}

          {/* Create new room card */}
          <button className="flex h-full min-h-[12rem] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-transparent p-4 text-gray-500 transition-all hover:border-gray-500 hover:bg-secondary/30 hover:text-gray-300">
            <ClientIcon icon="mdi:plus" className="mb-2 text-2xl" />
            <span className="text-sm font-medium">New Room</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default Page;
