import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DirectMessageModule } from 'src/direct-message/direct-message.module';
import { FriendRequestsGateway } from './friend-requests.gateway';

@Module({
  imports: [AuthModule, DirectMessageModule],
  providers: [FriendRequestsGateway],
})
export class FriendRequestsModule {}
