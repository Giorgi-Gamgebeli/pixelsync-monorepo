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
import { GroupChatService } from 'src/group-chat/group-chat.service';

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
    private readonly groupChatService: GroupChatService,
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

      // Join all group chat rooms
      this.userService
        .getGroupIds(user.sub)
        .then((groupIds) => {
          for (const gid of groupIds) {
            void client.join(`group:${gid}`);
          }
        })
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

  // ── Direct Messages ──

  @SubscribeMessage('dm:send')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: z.infer<typeof createDirectMessageSchema>,
  ) {
    const user = client.data.user;

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
        console.error('[Gateway] Failed to persist DM:', err);
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
        console.error('[Gateway] Failed to mark as read:', err);
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

  @SubscribeMessage('user:profile-update')
  async handleProfileUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    body: { userName?: string | null; name?: string | null; avatarConfig?: string | null },
  ) {
    const user = client.data.user;
    const friendIds = await this.userService.getFriendIds(user.sub);
    const payload = { userId: user.sub, ...body };
    for (const friendId of friendIds) {
      this.server.to(friendId).emit('user:profile-update', payload);
    }
  }

  // ── Group Chat ──

  @SubscribeMessage('group:send')
  async handleGroupSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { groupId: number; content: string },
  ) {
    const user = client.data.user;

    if (!body.content || typeof body.content !== 'string' || !body.content.trim()) return;
    if (!body.groupId || typeof body.groupId !== 'number') return;

    const isMember = await this.groupChatService.isMember(
      body.groupId,
      user.sub,
    );
    if (!isMember) return;

    const payload = {
      content: body.content,
      groupId: body.groupId,
      senderId: user.sub,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      sender: {
        userName: user.userName ?? null,
        avatarConfig: user.avatarConfig ?? null,
      },
    };

    this.server.to(`group:${body.groupId}`).emit('group:receive', payload);

    this.groupChatService
      .createMessage(body.groupId, user.sub, body.content)
      .catch((err) => {
        console.error('[Gateway] Failed to persist group message:', err);
      });
  }

  @SubscribeMessage('group:typing')
  async handleGroupTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { groupId: number; isTyping: boolean },
  ) {
    const user = client.data.user;

    if (!body.groupId || typeof body.groupId !== 'number') return;

    const isMember = await this.groupChatService.isMember(
      body.groupId,
      user.sub,
    );
    if (!isMember) return;

    client.to(`group:${body.groupId}`).emit('group:typing', {
      groupId: body.groupId,
      userId: user.sub,
      isTyping: body.isTyping,
    });
  }

  @SubscribeMessage('group:join')
  async handleGroupJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { groupId: number },
  ) {
    const user = client.data.user;

    if (!body.groupId || typeof body.groupId !== 'number') return;

    const isMember = await this.groupChatService.isMember(
      body.groupId,
      user.sub,
    );
    if (!isMember) return;

    void client.join(`group:${body.groupId}`);
  }
}
