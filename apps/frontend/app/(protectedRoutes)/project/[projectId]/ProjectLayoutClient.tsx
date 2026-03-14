"use client";

import { useState } from "react";
import ProjectSidebar from "./ProjectSidebar";
import CreateRoomModal from "./CreateRoomModal";
import InviteModal from "./InviteModal";

type Room = {
  id: string;
  name: string;
  onlineCount?: number;
};

type Member = {
  id: string;
  userName: string | null;
  status: string;
};

type ProjectLayoutClientProps = {
  projectId: string;
  projectName: string;
  rooms: Room[];
  members: Member[];
  children: React.ReactNode;
};

function ProjectLayoutClient({
  projectId,
  projectName,
  rooms,
  members,
  children,
}: ProjectLayoutClientProps) {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="flex flex-1 overflow-hidden">
      <ProjectSidebar
        projectId={projectId}
        projectName={projectName}
        rooms={rooms}
        members={members}
        onCreateRoom={() => setShowCreateRoom(true)}
        onInvite={() => setShowInvite(true)}
      />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>

      {showCreateRoom && (
        <CreateRoomModal
          projectId={projectId}
          onClose={() => setShowCreateRoom(false)}
        />
      )}
      {showInvite && (
        <InviteModal
          projectId={projectId}
          projectName={projectName}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}

export default ProjectLayoutClient;
