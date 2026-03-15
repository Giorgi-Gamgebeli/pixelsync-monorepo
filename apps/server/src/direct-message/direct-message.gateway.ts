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

      void client.join(user.sub);

      // Update status and notify only friends
      await this.userService.updateStatus({
        userId: user.sub,
        status: 'ONLINE',
      });

      const friendIds = await this.userService.getFriendIds(user.sub);
      for (const friendId of friendIds) {
        this.server.to(friendId).emit('user:status', {
          userId: user.sub,
          status: 'ONLINE',
        });
      }

      // Also tell the connecting user about their own status
      client.emit('user:status', {
        userId: user.sub,
        status: 'ONLINE',
      });

      this.directMessageService
        .getUnreadCounts(user.sub)
        .then((counts) => client.emit('dm:unread', counts))
        .catch(() => {});
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user) return;

    await this.userService.updateStatus({
      userId: user.sub,
      status: 'OFFLINE',
    });

    const friendIds = await this.userService.getFriendIds(user.sub);
    for (const friendId of friendIds) {
      this.server.to(friendId).emit('user:status', {
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

    // Validate friendship
    const friends = await this.userService.areFriends(
      user.sub,
      body.receiverId,
    );
    if (!friends) return;

    const payload = {
      ...body,
      senderId: user.sub,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRead: false,
    };

    this.server.to(body.receiverId).emit('dm:receive', payload);
    client.emit('dm:receive', payload);

    this.directMessageService
      .create({ ...body, senderId: user.sub })
      .catch((err) => {
        console.error('[DirectMessageGateway] Failed to persist message:', err);
      });
  }

  @SubscribeMessage('dm:read')
  handleRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { senderId: string },
  ) {
    const user = client.data.user;

    this.server
      .to(body.senderId)
      .emit('dm:read-ack', { readBy: user.sub });

    this.directMessageService
      .markAsRead(body.senderId, user.sub)
      .catch((err) => {
        console.error('[DirectMessageGateway] Failed to mark as read:', err);
      });
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
