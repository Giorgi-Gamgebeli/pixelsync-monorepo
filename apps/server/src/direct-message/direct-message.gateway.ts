import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DirectMessageService } from './direct-message.service';
import { SessionService } from 'src/auth/session.service';
import { createDirectMessageSchema, SessionPayloadSchema, z } from '@repo/zod';
import { cookieNames } from 'src/constants/auth';
import { UsersService } from 'src/users/users.service';

interface AuthenticatedSocket extends Socket {
  data: {
    user: z.infer<typeof SessionPayloadSchema>;
  };
}

@WebSocketGateway({
  // namespace: 'direct-messages',
  cors: { origin: process.env.NEXT_PUBLIC_BASE_URL, credentials: true },
})
export class DirectMessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  declare server: Server;

  constructor(
    private readonly directMessageService: DirectMessageService,
    private readonly sessionService: SessionService,
    private readonly userService: UsersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const rawCookie = client.handshake.headers.cookie ?? '';

    const cookies = Object.fromEntries(
      rawCookie.split(';').map((c) => {
        const [key, ...rest] = c.trim().split('=');
        return [key?.trim() ?? '', decodeURIComponent(rest.join('='))];
      }),
    );

    for (const name of cookieNames) {
      const token = cookies[name];
      if (typeof token === 'string' && token.length > 0) {
        try {
          const user = await this.sessionService.verifySession(token, name);
          client.data.user = user;

          await this.userService.updateStatus({
            userId: user.sub,
            status: 'ONLINE',
          });

          // Notify everyone that this user is now online
          this.server.emit('user:status', {
            userId: user.sub,
            status: 'ONLINE',
          });

          void client.join(user.sub);
          return;
        } catch {
          break;
        }
      }
    }

    client.disconnect();
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      await this.userService.updateStatus({
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
