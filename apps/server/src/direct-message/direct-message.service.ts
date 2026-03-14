import { Injectable } from '@nestjs/common';
import { db } from '@repo/db';
import { SessionPayloadSchema, createDirectMessageSchema, z } from '@repo/zod';

type SessionPayload = z.infer<typeof SessionPayloadSchema>;

@Injectable()
export class DirectMessageService {
  create(body: z.infer<typeof createDirectMessageSchema>) {
    return 'this adds new meessage';
  }

  async findAll(user: SessionPayload) {
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

  findOne(id: string) {}

  update(id: string) {}

  remove(id: string) {}
}
