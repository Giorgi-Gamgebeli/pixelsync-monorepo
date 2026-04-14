import { Module } from '@nestjs/common';
import { PresenceModule } from 'src/presence/presence.module';
import { FriendsGateway } from './friends.gateway';

@Module({
  imports: [PresenceModule],
  providers: [FriendsGateway],
})
export class FriendsModule {}
