import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { TokenPayloadSchema, z } from '@repo/zod';
import { AuthenticatedUser } from 'src/auth/authenticated-user.decorator';
import { NextAuthGuard } from 'src/auth/nextauth.guard';
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
  findAll(@AuthenticatedUser() user: z.infer<typeof TokenPayloadSchema>) {
    return this.directMessageService.findAll(user);
  }
}
