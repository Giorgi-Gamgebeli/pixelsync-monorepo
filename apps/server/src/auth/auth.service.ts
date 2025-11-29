import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { db } from '@repo/db';
import { compare } from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await db.user.findUnique({ where: { email } });

    if (!user || !user.password) return;

    const isSamePassword = await compare(password, user.password);

    // if (user && isSamePassword) {
    // }
  }
}
