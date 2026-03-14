import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NextAuthGuard } from './nextauth.guard';
import { SessionService } from './session.service';

@Module({
  imports: [ConfigModule],
  providers: [SessionService, NextAuthGuard],
  exports: [SessionService, NextAuthGuard],
})
export class AuthModule {}
