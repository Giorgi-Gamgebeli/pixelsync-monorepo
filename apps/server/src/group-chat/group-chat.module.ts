import { Module } from '@nestjs/common';
import { GroupChatService } from './group-chat.service';
import { GroupChatGateway } from './group-chat.gateway';

@Module({
  providers: [GroupChatService, GroupChatGateway],
  exports: [GroupChatService],
})
export class GroupChatModule {}
