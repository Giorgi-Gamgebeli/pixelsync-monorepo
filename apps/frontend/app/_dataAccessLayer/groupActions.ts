"use server";

import { auth } from "@/auth";
import { db } from "@repo/db";
import { CreateGroupChatSchema } from "@repo/zod";
import { z } from "zod";
import { handleErrorsOnServer, OperationalError } from "../_utils/helpers";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export const getGroupChats = cache(async function getGroupChats() {
  try {
    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    const groups = await db.groupChat.findMany({
      where: { members: { some: { id: session.user.id } } },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return groups;
  } catch (error) {
    return handleErrorsOnServer(error);
  }
});

export async function getGroupChatPageData(groupId: number) {
  try {
    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    const group = await db.groupChat.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        members: {
          select: {
            id: true,
            userName: true,
            avatarConfig: true,
            status: true,
          },
        },
      },
    });

    if (!group) throw new OperationalError("Group not found!");

    const isMember = group.members.some((m) => m.id === session.user.id);
    if (!isMember)
      throw new OperationalError("You are not a member of this group!");

    const messages = await db.groupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        sender: { select: { userName: true, avatarConfig: true } },
      },
    });

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { avatarConfig: true },
    });

    return {
      session,
      group,
      currentUserAvatarConfig: currentUser?.avatarConfig ?? null,
      messages: messages.reverse().map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        isEdited: m.isEdited,
        groupId: m.groupId,
        senderId: m.senderId,
        sender: m.sender,
      })),
    };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function createGroupChat(
  values: z.infer<typeof CreateGroupChatSchema>,
) {
  try {
    const result = CreateGroupChatSchema.safeParse(values);
    if (result.error)
      throw new OperationalError("Validation failed on server!");
    const { name, memberIds } = result.data;

    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    const group = await db.groupChat.create({
      data: {
        name,
        ownerId: session.user.id,
        members: {
          connect: [
            { id: session.user.id },
            ...memberIds.map((id) => ({ id })),
          ],
        },
      },
    });

    revalidatePath("/home", "layout");
    return { id: group.id };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}
