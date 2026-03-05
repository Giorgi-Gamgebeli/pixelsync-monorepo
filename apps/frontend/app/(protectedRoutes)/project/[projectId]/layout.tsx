import ProjectLayoutClient from "./ProjectLayoutClient";

type Params = {
  params: Promise<{
    projectId: string;
  }>;
  children: React.ReactNode;
};

async function Layout({ params, children }: Params) {
  const { projectId } = await params;

  // TODO: Fetch project data, rooms, and members from database
  const projectName = "My Project";
  const rooms = [
    { id: "room-1", name: "Wireframes", onlineCount: 3 },
    { id: "room-2", name: "Architecture" },
    { id: "room-3", name: "Logo Ideas", onlineCount: 1 },
  ];
  const members = [
    { id: "m-1", userName: "alex", status: "ONLINE" },
    { id: "m-2", userName: "niko", status: "ONLINE" },
    { id: "m-3", userName: "mari", status: "OFFLINE" },
  ];

  return (
    <ProjectLayoutClient
      projectId={projectId}
      projectName={projectName}
      rooms={rooms}
      members={members}
    >
      {children}
    </ProjectLayoutClient>
  );
}

export default Layout;
