import { PartialType } from '@nestjs/mapped-types';
import { CreateDirectMessagDto } from './create-direct-messag.dto';

export class UpdateDirectMessagDto extends PartialType(CreateDirectMessagDto) {}
