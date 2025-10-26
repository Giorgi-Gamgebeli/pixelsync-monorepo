import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import z from 'zod';
import { createDirectMessageSchema } from '@repo/zod';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('direct-message')
export class DirectMessageController {
  constructor(private readonly directMessageService: DirectMessageService) {}

  @Post()
  create(@Body() body: z.infer<typeof createDirectMessageSchema>) {
    return this.directMessageService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req) {
    return this.directMessageService.findAll(req);
  }

  @Get()
  findOne() {
    return this.directMessageService.findOne();
  }

  @Patch()
  update() {
    return this.directMessageService.update();
  }

  @Delete()
  remove() {
    return this.directMessageService.remove();
  }
}
