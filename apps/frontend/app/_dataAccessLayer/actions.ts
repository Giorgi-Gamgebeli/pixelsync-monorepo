"use server";

import { auth } from "@/auth";
import { handleErrorsOnServer, OperationalError } from "../_utils/helpers";
import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { cache } from "react";

type RoomBoardType = "NORMAL" | "WEB_DESIGN" | "WEB_DESIGN_HTML_CSS";

function isUnknownTypeFieldError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Unknown argument `type`") ||
    error.message.includes("Unknown field `type`")
  );
}

function hasBoardRecordModel() {
  return Boolean((db as unknown as { boardRecord?: unknown }).boardRecord);
}

function bytesToString(bytes: Uint8Array | Buffer | null | undefined) {
  if (!bytes) return "";
  try {
    return Buffer.from(bytes).toString("utf8");
  } catch {
    return "";
  }
}

export const getProjects = cache(async function getProjects() {
  try {
    const session = await auth();
    if (!session) return [];

    const projects = await db.projects.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { users: { some: { id: session.user.id } } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return projects;
  } catch (error) {
    return handleErrorsOnServer(error);
  }
});

export async function getProject(projectId: number) {
  try {
    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

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

    if (!isOwner && !isMember) throw new OperationalError("Not authorized!");

    return project;
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function getProjectRooms(projectId: number) {
  try {
    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    const whiteboards = await db.whiteboard.findMany({
      where: { workspaceId: projectId },
      select: {
        id: true,
        title: true,
        type: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return whiteboards;
  } catch (error) {
    if (isUnknownTypeFieldError(error)) {
      try {
        const whiteboards = await db.$queryRaw<
          Array<{ id: number; title: string; type: RoomBoardType | null }>
        >`
          SELECT "id", "title", "type"
          FROM "Whiteboard"
          WHERE "workspaceId" = ${projectId}
          ORDER BY "createdAt" ASC
        `;

        return whiteboards.map((room) => ({
          id: room.id,
          title: room.title,
          type: room.type ?? "NORMAL",
        }));
      } catch {
        const whiteboards = await db.whiteboard.findMany({
          where: { workspaceId: projectId },
          select: {
            id: true,
            title: true,
          },
          orderBy: { createdAt: "asc" },
        });

        return whiteboards.map((room) => ({
          ...room,
          type: "NORMAL" as const,
        }));
      }
    }

    return handleErrorsOnServer(error);
  }
}

export async function getRoom(roomId: number) {
  try {
    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    const room = await db.whiteboard.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        title: true,
        type: true,
        workspaceId: true,
      },
    });

    if (!room) return null;

    return room;
  } catch (error) {
    if (isUnknownTypeFieldError(error)) {
      try {
        const rows = await db.$queryRaw<
          Array<{
            id: number;
            title: string;
            type: RoomBoardType | null;
            workspaceId: number;
          }>
        >`
          SELECT "id", "title", "type", "workspaceId"
          FROM "Whiteboard"
          WHERE "id" = ${roomId}
          LIMIT 1
        `;

        const room = rows[0];
        if (!room) return null;

        return {
          id: room.id,
          title: room.title,
          type: room.type ?? "NORMAL",
          workspaceId: room.workspaceId,
        };
      } catch {
        const room = await db.whiteboard.findUnique({
          where: { id: roomId },
          select: {
            id: true,
            title: true,
            workspaceId: true,
          },
        });

        if (!room) return null;

        return { ...room, type: "NORMAL" as const };
      }
    }

    return handleErrorsOnServer(error);
  }
}

export async function createRoom(
  projectId: number,
  name: string,
  type: RoomBoardType = "NORMAL",
) {
  try {
    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    if (!name.trim()) throw new OperationalError("Room name is required!");

    await db.whiteboard.create({
      data: {
        title: name.trim(),
        content: Buffer.from(""),
        type: type,
        workspaceId: projectId,
      },
    });

    revalidatePath(`/project/${projectId}`);

    return { success: "Room created!" };
  } catch (error) {
    if (isUnknownTypeFieldError(error)) {
      try {
        await db.$executeRaw`
          INSERT INTO "Whiteboard" ("title", "content", "type", "workspaceId", "createdAt", "updatedAt")
          VALUES (${name.trim()}, ${Buffer.from("")}, CAST(${type} AS "BoardType"), ${projectId}, NOW(), NOW())
        `;
      } catch {
        await db.whiteboard.create({
          data: {
            title: name.trim(),
            content: Buffer.from(""),
            workspaceId: projectId,
          },
        });
      }

      revalidatePath(`/project/${projectId}`);
      return { success: "Room created!" };
    }

    return handleErrorsOnServer(error);
  }
}

type HtmlCssBoardPayload = {
  nodes: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    html: string;
    css: string;
  }>;
};

export async function getHtmlCssBoardPayload(
  roomId: number,
): Promise<HtmlCssBoardPayload | { error: string }> {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const room = await db.whiteboard.findUnique({
      where: { id: roomId },
      select: { content: true },
    });

    if (!room) throw new Error("Room not found!");

    const raw = bytesToString(room.content);
    if (!raw.trim()) return { nodes: [] };

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.nodes)) {
        return parsed as HtmlCssBoardPayload;
      }
      return { nodes: [] };
    } catch {
      return { nodes: [] };
    }
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function saveHtmlCssBoardPayload(
  roomId: number,
  payloadJson: string,
) {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const parsed = JSON.parse(payloadJson);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.nodes)) {
      throw new Error("Invalid payload");
    }

    await db.whiteboard.update({
      where: { id: roomId },
      data: {
        content: Buffer.from(payloadJson, "utf8"),
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function getBoardRecords(roomId: number) {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const room = await db.whiteboard.findUnique({
      where: { id: roomId },
      select: { id: true },
    });

    if (!room) throw new Error("Room not found!");

    if (!hasBoardRecordModel()) {
      const board = await db.whiteboard.findUnique({
        where: { id: roomId },
        select: { content: true },
      });

      const raw = bytesToString(board?.content);
      if (!raw.trim()) return [];

      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    const records = await db.boardRecord.findMany({
      where: { boardId: roomId },
      orderBy: { recordId: "asc" },
    });

    return records
      .map((record) => {
        try {
          return JSON.parse(record.data);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function saveBoardRecords(roomId: number, recordsJson: string) {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const room = await db.whiteboard.findUnique({
      where: { id: roomId },
      select: { id: true },
    });

    if (!room) throw new Error("Room not found!");

    const parsed = JSON.parse(recordsJson) as Array<{
      id: string;
      typeName?: string;
    }>;

    if (!Array.isArray(parsed)) throw new Error("Invalid record payload");

    if (!hasBoardRecordModel()) {
      await db.whiteboard.update({
        where: { id: roomId },
        data: {
          content: Buffer.from(recordsJson, "utf8"),
          updatedAt: new Date(),
        },
      });

      return { success: true };
    }

    const cleaned = parsed.filter(
      (record): record is { id: string; typeName?: string } =>
        !!record && typeof record.id === "string" && record.id.length > 0,
    );

    const ids = cleaned.map((record) => record.id);

    await db.$transaction([
      db.boardRecord.deleteMany({
        where: {
          boardId: roomId,
          ...(ids.length ? { recordId: { notIn: ids } } : {}),
        },
      }),
      ...cleaned.map((record) =>
        db.boardRecord.upsert({
          where: {
            boardId_recordId: {
              boardId: roomId,
              recordId: record.id,
            },
          },
          create: {
            recordId: record.id,
            boardId: roomId,
            typeName: record.typeName ?? "unknown",
            data: JSON.stringify(record),
          },
          update: {
            typeName: record.typeName ?? "unknown",
            data: JSON.stringify(record),
            boardId: roomId,
          },
        }),
      ),
    ]);

    return { success: true };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function generateInviteLink(projectId: number) {
  try {
    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    const project = await db.projects.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) throw new OperationalError("Project not found!");
    if (project.ownerId !== session.user.id)
      throw new OperationalError("Not authorized!");

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${project.id}`;

    return { success: inviteUrl };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function createProject(name: string) {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    if (!name.trim()) throw new Error("Project name is required!");

    const project = await db.projects.create({
      data: {
        name: name.trim(),
        ownerId: session.user.id,
        users: {
          connect: { id: session.user.id },
        },
      },
      select: { id: true },
    });

    revalidatePath("/home/friends"); // Refresh projects list in top nav

    return { success: project };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}
