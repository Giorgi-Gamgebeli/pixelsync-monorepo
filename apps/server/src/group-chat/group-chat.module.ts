import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { CallStateModule } from 'src/call-state/call-state.module';
import { GroupChatService } from './group-chat.service';
import { GroupChatGateway } from './group-chat.gateway';
import { PresenceModule } from 'src/presence/presence.module';

@Module({
  imports: [UsersModule, CallStateModule, PresenceModule],
  providers: [GroupChatService, GroupChatGateway],
  exports: [GroupChatService],
})
export class GroupChatModule {}
