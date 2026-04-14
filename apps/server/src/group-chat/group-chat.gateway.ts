import { OnModuleDestroy, Logger } from '@nestjs/common';
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
import {
  callGroupJoinSchema,
  callIdSchema,
  callMediaStateSchema,
  groupJoinSchema,
  groupSendSchema,
  groupTypingSchema,
} from '@repo/zod';
import { UsersService } from 'src/users/users.service';
import { GroupChatService } from './group-chat.service';
import { corsConfig } from 'src/config/cors';
import type { CallType, GroupMessage } from '@repo/types';
import { CallStateService } from 'src/call-state/call-state.service';
import { PresenceService } from 'src/presence/presence.service';
import type { AuthenticatedSocket } from 'src/presence/presence.types';

interface GroupCall {
  id: string;
  groupId: number;
  callType: CallType;
  participants: Map<string, { userName: string }>;
}

@WebSocketGateway({ cors: corsConfig })
export class GroupChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(GroupChatGateway.name);

  @WebSocketServer()
  declare server: Server;

  private groupCalls = new Map<string, GroupCall>();
  private groupCallByUser = new Map<string, string>();
  private messageLimits = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly MESSAGE_RATE_LIMIT = 9999;
  private readonly MESSAGE_RATE_WINDOW = 5_000;
  private rateLimitCleanupTimer: ReturnType<typeof setInterval>;

  constructor(
    private readonly groupChatService: GroupChatService,
    private readonly userService: UsersService,
    private readonly callState: CallStateService,
    private readonly presenceService: PresenceService,
  ) {
    this.rateLimitCleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [userId, limit] of this.messageLimits) {
        if (now > limit.resetTime) {
          this.messageLimits.delete(userId);
        }
      }
    }, 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.rateLimitCleanupTimer);
  }

  private isRateLimited(userId: string): boolean {
    const now = Date.now();
    const limit = this.messageLimits.get(userId);

    if (!limit || now > limit.resetTime) {
      this.messageLimits.set(userId, {
        count: 1,
        resetTime: now + this.MESSAGE_RATE_WINDOW,
      });
      return false;
    }

    limit.count++;
    return limit.count > this.MESSAGE_RATE_LIMIT;
  }

  private async isGroupMember(groupId: number, userId: string) {
    try {
      return await this.groupChatService.isMember(groupId, userId);
    } catch (error) {
      this.logger.error(error, 'Failed to check group membership');
      return false;
    }
  }

  private async cleanupUserGroupCalls(userId: string) {
    const callId = this.groupCallByUser.get(userId);
    if (!callId) return;

    const groupCall = this.groupCalls.get(callId);
    this.groupCallByUser.delete(userId);
    this.callState.clearCall(userId, callId);

    if (!groupCall) return;

    groupCall.participants.delete(userId);
    const participantCount = groupCall.participants.size;

    this.server.to(`group:${groupCall.groupId}`).emit('call:group-left', {
      callId,
      groupId: groupCall.groupId,
      userId,
      participantCount,
    });

    if (participantCount === 0) {
      this.groupCalls.delete(callId);
      this.server
        .to(`group:${groupCall.groupId}`)
        .emit('call:group-call-ended', {
          groupId: groupCall.groupId,
        });
    }
  }

  async handleConnection(client: AuthenticatedSocket) {
    const connection = await this.presenceService.handleConnection(
      client,
      this.server,
    );
    if (!connection) return;

    this.userService
      .getGroupIds(connection.user.sub)
      .then((groupIds) => {
        for (const gid of groupIds) {
          void client.join(`group:${gid}`);
        }
      })
      .catch((error) => {
        this.logger.error(error, 'Failed to join group rooms');
      });
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const connection = await this.presenceService.handleDisconnect(
      client,
      this.server,
    );
    const user = client.data.user;
    if (!user) return;

    if (connection?.lastConnection) {
      await this.cleanupUserGroupCalls(user.sub);
    }
  }

  @SubscribeMessage('group:send')
  async handleGroupSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = groupSendSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    if (this.isRateLimited(user.sub)) return;

    if (!(await this.isGroupMember(body.groupId, user.sub))) return;

    const payload = {
      id: body.id,
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
    } satisfies GroupMessage;

    this.server.to(`group:${body.groupId}`).emit('group:receive', payload);

    this.groupChatService
      .createMessage(body.id, body.groupId, user.sub, body.content)
      .catch((err: unknown) => {
        this.logger.error(err, 'Failed to persist group message');
      });
  }

  @SubscribeMessage('group:typing')
  async handleGroupTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = groupTypingSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    if (!(await this.isGroupMember(body.groupId, user.sub))) return;

    client.to(`group:${body.groupId}`).emit('group:typing', {
      groupId: body.groupId,
      userId: user.sub,
      isTyping: body.isTyping,
    });
  }

  @SubscribeMessage('group:join')
  async handleGroupJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = groupJoinSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    if (!(await this.isGroupMember(body.groupId, user.sub))) return;

    void client.join(`group:${body.groupId}`);
  }

  @SubscribeMessage('call:group-join')
  async handleGroupCallJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callGroupJoinSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    if (this.callState.isActive(user.sub)) {
      client.emit('call:error', { message: 'Already in a call' });
      return;
    }

    if (!(await this.isGroupMember(body.groupId, user.sub))) {
      client.emit('call:error', { message: 'Not a group member' });
      return;
    }

    let groupCall: GroupCall | undefined;
    for (const gc of this.groupCalls.values()) {
      if (gc.groupId === body.groupId) {
        groupCall = gc;
        break;
      }
    }

    if (!groupCall) {
      const callId = crypto.randomUUID();
      groupCall = {
        id: callId,
        groupId: body.groupId,
        callType: body.callType,
        participants: new Map(),
      };
      this.groupCalls.set(callId, groupCall);
    }

    const existingParticipants = Array.from(
      groupCall.participants.entries(),
    ).map(([userId, info]) => ({ userId, userName: info.userName }));

    client.emit('call:group-active', {
      callId: groupCall.id,
      participants: existingParticipants,
    });

    const userName = user.userName ?? 'Unknown';
    groupCall.participants.set(user.sub, { userName });
    this.groupCallByUser.set(user.sub, groupCall.id);
    this.callState.setCall(user.sub, groupCall.id);

    const participantCount = groupCall.participants.size;

    if (participantCount === 1) {
      this.server.to(`group:${body.groupId}`).emit('call:group-call-started', {
        groupId: body.groupId,
        callId: groupCall.id,
        participantCount: 1,
      });
    } else {
      this.server.to(`group:${body.groupId}`).emit('call:group-joined', {
        callId: groupCall.id,
        groupId: body.groupId,
        userId: user.sub,
        userName,
        participantCount,
      });
    }
  }

  @SubscribeMessage('call:group-leave')
  async handleGroupCallLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callIdSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;
    const groupCall = this.groupCalls.get(body.callId);
    if (!groupCall || !groupCall.participants.has(user.sub)) return;

    const groupId = groupCall.groupId;
    groupCall.participants.delete(user.sub);
    this.groupCallByUser.delete(user.sub);
    this.callState.clearCall(user.sub, body.callId);
    const participantCount = groupCall.participants.size;

    this.server.to(`group:${groupId}`).emit('call:group-left', {
      callId: body.callId,
      groupId,
      userId: user.sub,
      participantCount,
    });

    if (participantCount === 0) {
      this.groupCalls.delete(body.callId);
      this.server.to(`group:${groupId}`).emit('call:group-call-ended', {
        groupId,
      });
    }
  }

  @SubscribeMessage('call:media-state')
  handleCallMediaState(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callMediaStateSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    const groupCall = this.groupCalls.get(body.callId);
    if (!groupCall) return;

    for (const [participantId] of groupCall.participants) {
      if (participantId !== user.sub) {
        this.server.to(participantId).emit('call:media-state', {
          userId: user.sub,
          audioEnabled: body.audioEnabled,
          videoEnabled: body.videoEnabled,
        });
      }
    }
  }
}
