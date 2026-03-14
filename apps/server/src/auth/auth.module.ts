import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NextAuthGuard } from './nextauth.guard';
import { TokenService } from './token.service';

@Module({
  imports: [ConfigModule],
  providers: [TokenService, NextAuthGuard],
  exports: [TokenService, NextAuthGuard],
})
export class AuthModule {}
