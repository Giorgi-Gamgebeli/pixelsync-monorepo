import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../../.env') });

import './instrument';

import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { corsConfig } from './config/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(cookieParser());

  app.enableCors(corsConfig);

  await app.listen(process.env.SERVER_PORT ?? 3000);
}
void bootstrap();
