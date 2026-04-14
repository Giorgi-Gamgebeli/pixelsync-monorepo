import { Module } from '@nestjs/common';
import { DirectMessageController } from './direct-message.controller';
import { DirectMessageService } from './direct-message.service';
import { UsersModule } from 'src/users/users.module';
import { CallStateModule } from 'src/call-state/call-state.module';
import { DirectMessageGateway } from './direct-message.gateway';
import { PresenceModule } from 'src/presence/presence.module';

@Module({
  imports: [UsersModule, CallStateModule, PresenceModule],
  controllers: [DirectMessageController],
  providers: [DirectMessageService, DirectMessageGateway],
  exports: [DirectMessageGateway],
})
export class DirectMessageModule {}
