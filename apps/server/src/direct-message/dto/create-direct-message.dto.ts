import { createZodDto } from 'nestjs-zod';
import { createDirectMessageSchema } from '@repo/zod';

export class CreateDirectMessageDto extends createZodDto(
  createDirectMessageSchema,
) {}
