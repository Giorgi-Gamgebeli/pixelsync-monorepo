import { updateStatusSchema } from '@repo/zod';
import { createZodDto } from 'nestjs-zod';

export class UpdateStatusDto extends createZodDto(updateStatusSchema) {}
