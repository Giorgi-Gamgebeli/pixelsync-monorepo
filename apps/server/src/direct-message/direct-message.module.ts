import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DirectMessageController } from './direct-message.controller';
import { DirectMessageService } from './direct-message.service';
import { UsersModule } from 'src/users/users.module';
import { CallStateModule } from 'src/call-state/call-state.module';
import { DirectMessageGateway } from './direct-message.gateway';
import { PresenceModule } from 'src/presence/presence.module';

@Module({
  imports: [UsersModule, CallStateModule, PresenceModule, AuthModule],
  controllers: [DirectMessageController],
  providers: [DirectMessageService, DirectMessageGateway],
  exports: [DirectMessageGateway],
})
export class DirectMessageModule {}
