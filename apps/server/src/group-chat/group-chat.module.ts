import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { CallStateModule } from 'src/call-state/call-state.module';
import { GroupChatService } from './group-chat.service';
import { GroupChatGateway } from './group-chat.gateway';

@Module({
  imports: [AuthModule, UsersModule, CallStateModule],
  providers: [GroupChatService, GroupChatGateway],
  exports: [GroupChatService],
})
export class GroupChatModule {}
