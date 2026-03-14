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
