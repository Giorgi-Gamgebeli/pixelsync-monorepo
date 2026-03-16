import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { db } from '@repo/db';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async getFriendIds(userId: string): Promise<string[]> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        friends: { select: { id: true } },
        friendOf: { select: { id: true } },
      },
    });

    if (!user) return [];

    const friendIds = new Set<string>();
    for (const f of user.friends) friendIds.add(f.id);
    for (const f of user.friendOf) friendIds.add(f.id);
    return [...friendIds];
  }

  async getGroupIds(userId: string): Promise<number[]> {
    const groups = await db.groupChat.findMany({
      where: { members: { some: { id: userId } } },
      select: { id: true },
    });
    return groups.map((g) => g.id);
  }

  async areFriends(userA: string, userB: string): Promise<boolean> {
    const count = await db.user.count({
      where: {
        id: userA,
        friends: { some: { id: userB } },
        friendOf: { some: { id: userB } },
      },
    });
    return count > 0;
  }

  async updateStatus({ userId, status }: UpdateStatusDto) {
    try {
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: {
          status,
          lastSeen: new Date(),
        },
      });

      return updatedUser;
    } catch (error) {
      this.logger.error(error, 'updateStatus unknown error');
      throw new InternalServerErrorException('Failed to update user status');
    }
  }
}
