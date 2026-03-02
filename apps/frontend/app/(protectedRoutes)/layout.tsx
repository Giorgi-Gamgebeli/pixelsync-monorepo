import { getProjects } from "../_dataAcessLayer/actions";
import TopNav from "./TopNav";

async function Layout({ children }: { children: React.ReactNode }) {
  const result = await getProjects();
  const projects = Array.isArray(result) ? result : undefined;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-primary">
      <TopNav projects={projects} />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

export default Layout;
