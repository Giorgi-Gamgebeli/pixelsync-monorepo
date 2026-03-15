import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createDirectMessageSchema, TokenPayloadSchema, z } from '@repo/zod';
import { decode } from '@auth/core/jwt';
import { Server, Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';
import { DirectMessageService } from './direct-message.service';

interface AuthenticatedSocket extends Socket {
  data: {
    user: z.infer<typeof TokenPayloadSchema>;
  };
}

@WebSocketGateway({
  cors: { origin: process.env.NEXT_PUBLIC_BASE_URL, credentials: true },
})
export class DirectMessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  declare server: Server;

  constructor(
    private readonly directMessageService: DirectMessageService,
    private readonly userService: UsersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const { token, salt } = client.handshake.auth ?? {};

      if (!token || !salt) {
        client.disconnect();
        return;
      }

      const payload = await decode({
        token,
        secret: process.env.NEXTAUTH_SECRET!,
        salt,
      });

      if (!payload) {
        client.disconnect();
        return;
      }

      const user = TokenPayloadSchema.parse(payload);
      client.data.user = user;

      await this.userService.updateStatus({
        userId: user.sub,
        status: 'ONLINE',
      });

      this.server.emit('user:status', {
        userId: user.sub,
        status: 'ONLINE',
      });

      void client.join(user.sub);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      await this.userService.updateStatus({
        userId: user.sub,
        status: 'OFFLINE',
      });

      this.server.emit('user:status', {
        userId: user.sub,
        status: 'OFFLINE',
      });
    }
  }

  @SubscribeMessage('dm:send')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: z.infer<typeof createDirectMessageSchema>,
  ) {
    const user = client.data.user;

    const message = await this.directMessageService.create({
      ...body,
      senderId: user.sub,
    });

    this.server.to(body.receiverId).emit('dm:receive', message);

    client.emit('dm:receive', message);
  }

  @SubscribeMessage('dm:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { receiverId: string; isTyping: boolean },
  ) {
    const user = client.data.user;
    this.server.to(body.receiverId).emit('dm:typing', {
      userId: user.sub,
      isTyping: body.isTyping,
    });
  }
}
