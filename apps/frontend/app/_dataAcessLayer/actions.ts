import { handleErrorsOnServer } from "../_utils/helpers";
import { db } from "./db";

export async function getProjects() {
  try {
    const projects = await db.projects.findMany();

    return projects;
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}
