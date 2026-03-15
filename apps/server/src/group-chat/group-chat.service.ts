import { Injectable } from '@nestjs/common';
import { db } from '@repo/db';

@Injectable()
export class GroupChatService {
  async create(name: string, ownerId: string, memberIds: string[]) {
    return db.groupChat.create({
      data: {
        name,
        ownerId,
        members: {
          connect: [
            { id: ownerId },
            ...memberIds.map((id) => ({ id })),
          ],
        },
      },
      include: {
        members: {
          select: { id: true, userName: true, avatarConfig: true },
        },
      },
    });
  }

  async getMessages(groupId: number) {
    return db.groupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { userName: true, avatarConfig: true } },
      },
    });
  }

  async createMessage(groupId: number, senderId: string, content: string) {
    return db.groupMessage.create({
      data: { content, groupId, senderId },
    });
  }

  async isMember(groupId: number, userId: string): Promise<boolean> {
    const count = await db.groupChat.count({
      where: {
        id: groupId,
        members: { some: { id: userId } },
      },
    });
    return count > 0;
  }

  async getMemberIds(groupId: number): Promise<string[]> {
    const group = await db.groupChat.findUnique({
      where: { id: groupId },
      select: { members: { select: { id: true } } },
    });
    return group?.members.map((m) => m.id) ?? [];
  }
}
