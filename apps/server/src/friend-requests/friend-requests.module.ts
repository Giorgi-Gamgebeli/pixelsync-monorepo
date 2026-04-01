import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { FriendRequestsGateway } from './friend-requests.gateway';

@Module({
  imports: [AuthModule],
  providers: [FriendRequestsGateway],
})
export class FriendRequestsModule {}
