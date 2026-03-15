import { Injectable } from '@nestjs/common';
import { db } from '@repo/db';
import { createDirectMessageSchema, TokenPayloadSchema, z } from '@repo/zod';

@Injectable()
export class DirectMessageService {
  async create(body: z.infer<typeof createDirectMessageSchema>) {
    try {
      const message = await db.directMessage.create({
        data: {
          content: body.content,
          senderId: body.senderId,
          receiverId: body.receiverId,
        },
        include: {
          sender: { select: { id: true, name: true, image: true } },
          receiver: { select: { id: true, name: true, image: true } },
        },
      });

      return message;
    } catch (error: unknown) {
      console.error('[DirectMessageService] create error:', error);
      throw error;
    }
  }

  async findAll(user: z.infer<typeof TokenPayloadSchema>) {
    try {
      const messages = await db.directMessage.findMany({
        where: {
          OR: [{ senderId: user.sub }, { receiverId: user.sub }],
        },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, name: true, image: true } },
          receiver: { select: { id: true, name: true, image: true } },
        },
      });

      return messages;
    } catch (error: unknown) {
      console.error('[DirectMessageService] findMany error:', error);
      throw error;
    }
  }

  async getUnreadCounts(userId: string): Promise<Record<string, number>> {
    const results = await db.directMessage.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        isRead: false,
      },
      _count: true,
    });

    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r.senderId] = r._count;
    }
    return counts;
  }

  async markAsRead(senderId: string, receiverId: string) {
    await db.directMessage.updateMany({
      where: {
        senderId,
        receiverId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  findOne(id: string) {}

  update(id: string) {}

  remove(id: string) {}
}
