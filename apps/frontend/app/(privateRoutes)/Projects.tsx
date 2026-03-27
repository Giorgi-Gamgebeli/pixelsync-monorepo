import { getProjects } from "../_dataAccessLayer/actions";
import AddServer from "./AddProject";
import Server from "./Project";

async function Projects() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: render project list from this data
  const projects = await getProjects();

  return (
    <div className="flex w-26 justify-center">
      <div className="flex flex-col items-center">
        <Server href="/home/friends" logo="/noBGLogo.png" />
        <div className="my-3 w-[80%] border-b border-gray-300" />

        <AddServer />
      </div>
    </div>
  );
}

export default Projects;
