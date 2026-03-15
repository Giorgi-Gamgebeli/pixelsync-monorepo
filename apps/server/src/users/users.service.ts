import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { db } from '@repo/db';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class UsersService {
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

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
      console.error('[UsersService] updateStatus unknown error:', error);
      throw new InternalServerErrorException('Failed to update user status');
    }
  }
}
