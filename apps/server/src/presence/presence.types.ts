import { TokenPayloadSchema, z } from '@repo/zod';
import type { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: z.infer<typeof TokenPayloadSchema>;
  };
}
