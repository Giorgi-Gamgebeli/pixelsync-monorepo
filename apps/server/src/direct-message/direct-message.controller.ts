import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SessionPayloadSchema, z } from '@repo/zod';
import { NextAuthGuard } from 'src/auth/nextauth.guard';
import { SessionUser } from 'src/auth/session-user.decorator';
import { DirectMessageService } from './direct-message.service';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';

@Controller('direct-message')
export class DirectMessageController {
  constructor(private readonly directMessageService: DirectMessageService) {}

  @UseGuards(NextAuthGuard)
  @Post()
  create(@Body() body: CreateDirectMessageDto) {
    return this.directMessageService.create(body);
  }

  @UseGuards(NextAuthGuard)
  @Get()
  findAll(@SessionUser() user: z.infer<typeof SessionPayloadSchema>) {
    return this.directMessageService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.directMessageService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.directMessageService.update(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.directMessageService.remove(id);
  }
}
