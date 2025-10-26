import { Module } from '@nestjs/common';
import { DirectMessagService } from './direct-messag.service';
import { DirectMessagController } from './direct-messag.controller';

@Module({
  controllers: [DirectMessagController],
  providers: [DirectMessagService],
})
export class DirectMessagModule {}
