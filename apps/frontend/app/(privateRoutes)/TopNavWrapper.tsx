import { auth } from "@/auth";
import { getProjects } from "../_dataAccessLayer/actions";
import TopNav from "./TopNav";

async function TopNavWrapper() {
  const result = await getProjects();
  const projects = Array.isArray(result) ? result : undefined;
  const session = await auth();

  if (!session) return null;

  return <TopNav session={session} projects={projects} />;
}

export default TopNavWrapper;
