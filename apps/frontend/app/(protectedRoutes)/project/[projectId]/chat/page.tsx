import { getProject } from "@/app/_dataAccessLayer/actions";
import { notFound } from "next/navigation";

type Params = {
  params: Promise<{
    projectId: string;
  }>;
};

async function Page({ params }: Params) {
  const { projectId } = await params;
  const project = await getProject(Number(projectId));

  if (!project || "error" in project) {
    notFound();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-border border-b px-6 py-4">
        <h1 className="text-lg font-semibold text-white">Project Chat</h1>
        <p className="text-sm text-gray-500">
          Board canvas and chat are intentionally separated. Open a room to
          draw, come back here to chat.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="border-border bg-secondary/50 w-full max-w-2xl rounded-xl border p-8 text-center">
          <p className="text-sm text-gray-300">
            Chat panel moved from board view to this project-level page.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Hook this page to your realtime project chat provider next.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Page;
