import { getProjects } from "../_dataAcessLayer/actions";
import AddServer from "./AddProject";
import Server from "./Project";

async function Projects() {
  const servers = await getProjects();

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
