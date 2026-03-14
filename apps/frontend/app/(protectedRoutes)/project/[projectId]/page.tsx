"use client";

import ClientIcon from "@/app/_components/ClientIcon";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getProjectRooms } from "@/app/_dataAccessLayer/actions";
import CreateRoomModal from "./CreateRoomModal";

type Room = {
  id: number;
  title: string;
};

function Page() {
  const { projectId } = useParams<{ projectId: string }>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  useEffect(() => {
    async function loadRooms() {
      const result = await getProjectRooms(Number(projectId));
      if (Array.isArray(result)) {
        setRooms(result);
      }
    }
    loadRooms();
  }, [projectId]);

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
                    {room.title}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {/* Create new room card */}
          <button
            onClick={() => setShowCreateRoom(true)}
            className="flex h-full min-h-[12rem] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-transparent p-4 text-gray-500 transition-all hover:border-gray-500 hover:bg-secondary/30 hover:text-gray-300"
          >
            <ClientIcon icon="mdi:plus" className="mb-2 text-2xl" />
            <span className="text-sm font-medium">New Room</span>
          </button>
        </div>
      )}

      {showCreateRoom && (
        <CreateRoomModal
          projectId={projectId}
          onClose={() => setShowCreateRoom(false)}
        />
      )}
    </div>
  );
}

export default Page;
