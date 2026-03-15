"use server";

import { auth } from "@/auth";
import { handleErrorsOnServer } from "../_utils/helpers";
import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export const getProjects = cache(async function getProjects() {
  try {
    const projects = await db.projects.findMany();

    return projects;
  } catch (error) {
    return handleErrorsOnServer(error);
  }
});

export async function getProject(projectId: number) {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const project = await db.projects.findUnique({
      where: { id: projectId },
      include: {
        whiteboards: {
          select: {
            id: true,
            title: true,
          },
          orderBy: { createdAt: "asc" },
        },
        owner: {
          select: {
            id: true,
            userName: true,
            status: true,
          },
        },
        users: {
          select: {
            id: true,
            userName: true,
            status: true,
          },
        },
      },
    });

    if (!project) return null;

    const isOwner = project.ownerId === session.user.id;
    const isMember = project.users.some((u) => u.id === session.user.id);

    if (!isOwner && !isMember) throw new Error("Not authorized!");

    return project;
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function getProjectRooms(projectId: number) {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const whiteboards = await db.whiteboard.findMany({
      where: { workspaceId: projectId },
      select: {
        id: true,
        title: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return whiteboards;
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function getRoom(roomId: number) {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const room = await db.whiteboard.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        title: true,
        workspaceId: true,
      },
    });

    if (!room) return null;

    return room;
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function createRoom(projectId: number, name: string) {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    if (!name.trim()) throw new Error("Room name is required!");

    await db.whiteboard.create({
      data: {
        title: name.trim(),
        content: Buffer.from(""),
        workspaceId: projectId,
      },
    });

    revalidatePath(`/project/${projectId}`);

    return { success: "Room created!" };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function generateInviteLink(projectId: number) {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const project = await db.projects.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) throw new Error("Project not found!");

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL_SECONDARY || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${project.id}`;

    return { success: inviteUrl };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}
