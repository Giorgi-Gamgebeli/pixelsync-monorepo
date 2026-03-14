import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from root .env before any other imports
// Going up 3 levels to reach the monorepo root (from dist/src/main.js)
dotenv.config({ path: join(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Must be registered before any guards so req.cookies is populated
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.NEXT_PUBLIC_BASE_URL,
    credentials: true,
  });

  await app.listen(process.env.SERVER_PORT ?? 3000);
}
void bootstrap();
