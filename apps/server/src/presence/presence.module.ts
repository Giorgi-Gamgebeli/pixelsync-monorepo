import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { PresenceService } from './presence.service';

@Module({
  imports: [AuthModule, UsersModule],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
