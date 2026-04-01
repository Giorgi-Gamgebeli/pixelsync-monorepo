import { Module } from '@nestjs/common';
import { DirectMessageController } from './direct-message.controller';
import { DirectMessageService } from './direct-message.service';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { CallStateModule } from 'src/call-state/call-state.module';

import { DirectMessageGateway } from './direct-message.gateway';

@Module({
  imports: [AuthModule, UsersModule, CallStateModule],
  controllers: [DirectMessageController],
  providers: [DirectMessageService, DirectMessageGateway],
})
export class DirectMessageModule {}
