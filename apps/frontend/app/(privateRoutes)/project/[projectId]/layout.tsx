import { Suspense } from "react";
import { getProject } from "@/app/_dataAccessLayer/actions";
import { notFound } from "next/navigation";
import ProjectLayoutClient from "./ProjectLayoutClient";
import Loading from "./loading";

type Params = {
  params: Promise<{
    projectId: string;
  }>;
  children: React.ReactNode;
};

async function ProjectLayoutContent({ params, children }: Params) {
  const { projectId } = await params;

  const project = await getProject(Number(projectId));

  if (!project || "error" in project) {
    notFound();
  }

  const rooms = project.whiteboards.map((wb) => ({
    id: String(wb.id),
    name: wb.title,
  }));

  const members = [
    {
      id: project.owner.id,
      userName: project.owner.userName,
      status: project.owner.status,
    },
    ...project.users
      .filter((u) => u.id !== project.owner.id)
      .map((u) => ({
        id: u.id,
        userName: u.userName,
        status: u.status,
      })),
  ];

  return (
    <ProjectLayoutClient
      projectId={projectId}
      projectName={project.name}
      rooms={rooms}
      members={members}
    >
      {children}
    </ProjectLayoutClient>
  );
}

function Layout({ params, children }: Params) {
  return (
    <Suspense fallback={<Loading />}>
      <ProjectLayoutContent params={params}>{children}</ProjectLayoutContent>
    </Suspense>
  );
}

export default Layout;
