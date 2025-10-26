import { Injectable } from '@nestjs/common';
import { db } from '@repo/db';
import { createDirectMessageSchema, GetDirectMessagesSchema } from '@repo/zod';
import z from 'zod';

@Injectable()
export class DirectMessageService {
  create(body: z.infer<typeof createDirectMessageSchema>) {
    return 'this adds new meessage';
  }

  async findAll(req) {
    // console.log(req);
    return { res: 'wtf it works?' }; // return db.directMessage.findMany();

    // try {
    //   const res = GetDirectMessagesSchema.safeParse(values);
    //   if (res.error) throw new Error('Validaiton failed on server!');
    //   const { id } = res.data;
    //
    //   const session = await auth();
    //   if (!session) throw new Error('Not authenticated!');
    //
    //   const friend = await db.user.findUnique({
    //     where: {
    //       id,
    //     },
    //     select: {
    //       friends: {
    //         where: {
    //           id: session.user.id,
    //         },
    //       },
    //       friendOf: {
    //         where: {
    //           id: session.user.id,
    //         },
    //       },
    //     },
    //   });
    //
    //   if (id === session.user.id) {
    //     throw new Error('You cannot perform this action on yourself.');
    //   }
    //
    //   if (!friend) throw new Error('Friend was not found!');
    //
    //   const isFriend = friend.friends.length > 0 && friend.friendOf.length > 0;
    //
    //   if (!isFriend) throw new Error('You are not friends with this user!');
    //
    //   const messages = await db.directMessage.findMany({
    //     where: {
    //       OR: [
    //         { receiverId: id, senderId: session.user.id },
    //         { receiverId: session.user.id, senderId: id },
    //       ],
    //     },
    //     orderBy: {
    //       createdAt: 'asc',
    //     },
    //   });
    //
    //   return messages;
    // } catch (error) {
    //   console.error(error);
    // }
  }

  findOne() {}

  update() {}

  remove() {}
}
