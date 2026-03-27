import { getProjects } from "../_dataAccessLayer/actions";
import TopNav from "./TopNav";

async function TopNavWrapper() {
  const result = await getProjects();
  const projects = Array.isArray(result) ? result : undefined;
  return <TopNav projects={projects} />;
}

export default TopNavWrapper;
