import { Injectable } from '@nestjs/common';
import { CreateDirectMessagDto } from './dto/create-direct-messag.dto';
import { UpdateDirectMessagDto } from './dto/update-direct-messag.dto';

@Injectable()
export class DirectMessagService {
  create(createDirectMessagDto: CreateDirectMessagDto) {
    return 'This action adds a new directMessag';
  }

  findAll() {
    return `This action returns all directMessag`;
  }

  findOne(id: number) {
    return `This action returns a #${id} directMessag`;
  }

  update(id: number, updateDirectMessagDto: UpdateDirectMessagDto) {
    return `This action updates a #${id} directMessag`;
  }

  remove(id: number) {
    return `This action removes a #${id} directMessag`;
  }
}
