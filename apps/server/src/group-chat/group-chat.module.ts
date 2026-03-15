import { Module } from '@nestjs/common';
import { GroupChatService } from './group-chat.service';

@Module({
  providers: [GroupChatService],
  exports: [GroupChatService],
})
export class GroupChatModule {}
