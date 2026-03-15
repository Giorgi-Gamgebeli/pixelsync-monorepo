import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { TokenPayloadSchema, z } from '@repo/zod';
import { Server, Socket } from 'socket.io';
import { GroupChatService } from './group-chat.service';

interface AuthenticatedSocket extends Socket {
  data: {
    user: z.infer<typeof TokenPayloadSchema>;
  };
}

@WebSocketGateway({
  cors: { origin: process.env.NEXT_PUBLIC_BASE_URL, credentials: true },
})
export class GroupChatGateway {
  @WebSocketServer()
  declare server: Server;

  constructor(private readonly groupChatService: GroupChatService) {}

  @SubscribeMessage('group:send')
  async handleGroupSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { groupId: number; content: string },
  ) {
    const user = client.data.user;

    const isMember = await this.groupChatService.isMember(
      body.groupId,
      user.sub,
    );
    if (!isMember) return;

    const payload = {
      id: -Date.now(),
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
        console.error('[GroupChatGateway] Failed to persist message:', err);
      });
  }

  @SubscribeMessage('group:typing')
  handleGroupTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { groupId: number; isTyping: boolean },
  ) {
    const user = client.data.user;
    client.to(`group:${body.groupId}`).emit('group:typing', {
      groupId: body.groupId,
      userId: user.sub,
      isTyping: body.isTyping,
    });
  }

  @SubscribeMessage('group:join')
  handleGroupJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { groupId: number },
  ) {
    void client.join(`group:${body.groupId}`);
  }
}
