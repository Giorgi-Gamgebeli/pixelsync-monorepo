import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import {
  createDirectMessageSchema,
  TokenPayloadSchema,
  z,
  groupSendSchema,
  groupTypingSchema,
  groupJoinSchema,
  callInitiateSchema,
  callIdSchema,
  callOfferSchema,
  callAnswerSchema,
  callIceCandidateSchema,
  callMediaStateSchema,
  callGroupJoinSchema,
  dmTypingSchema,
  profileUpdateSchema,
} from '@repo/zod';
import { Server, Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';
import { DirectMessageService } from './direct-message.service';
import { GroupChatService } from 'src/group-chat/group-chat.service';
import { TokenService } from 'src/auth/token.service';
import { corsConfig } from 'src/config/cors';
import type { CallType, DirectMessage, GroupMessage } from '@repo/types';

interface AuthenticatedSocket extends Socket {
  data: {
    user: z.infer<typeof TokenPayloadSchema>;
  };
}

interface DmCall {
  id: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  callType: CallType;
  status: 'ringing' | 'active';
  timeout: ReturnType<typeof setTimeout>;
}

interface GroupCall {
  id: string;
  groupId: number;
  callType: CallType;
  participants: Map<string, { userName: string }>;
}

@WebSocketGateway({ cors: corsConfig })
export class DirectMessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(DirectMessageGateway.name);

  @WebSocketServer()
  declare server: Server;

  private dmCalls = new Map<string, DmCall>();
  private groupCalls = new Map<string, GroupCall>();
  private userActiveCalls = new Map<string, string>(); // userId -> callId

  // Multi-tab: track how many connections each user has
  private userConnections = new Map<string, number>();

  // Rate limiting: userId -> { count, resetTime }
  private messageLimits = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly MESSAGE_RATE_LIMIT = 9999; // max messages per window
  private readonly MESSAGE_RATE_WINDOW = 5_000; // 5 seconds

  // Periodic cleanup for stale rate limit entries
  private rateLimitCleanupTimer: ReturnType<typeof setInterval>;

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

  constructor(
    private readonly directMessageService: DirectMessageService,
    private readonly userService: UsersService,
    private readonly groupChatService: GroupChatService,
    private readonly tokenService: TokenService,
  ) {
    // Clean up expired rate limit entries every 60 seconds
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

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const { token, salt } = client.handshake.auth ?? {};

      if (!token || !salt) {
        client.disconnect();
        return;
      }

      const user = await this.tokenService.verifyToken(
        token as string,
        salt as string,
      );
      client.data.user = user;

      void client.join(user.sub);

      // Track connection count for multi-tab support
      const prevCount = this.userConnections.get(user.sub) ?? 0;
      this.userConnections.set(user.sub, prevCount + 1);

      // Only go ONLINE on first connection (not additional tabs)
      if (prevCount === 0) {
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
      }

      // Always tell the connecting client about their own status
      client.emit('user:status', {
        userId: user.sub,
        status: 'ONLINE',
      });

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

    this.cleanupUserCalls(user.sub);

    // Decrement connection count
    const count = (this.userConnections.get(user.sub) ?? 1) - 1;
    if (count <= 0) {
      this.userConnections.delete(user.sub);
      this.messageLimits.delete(user.sub);

      // Last tab closed — go OFFLINE
      try {
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
      } catch (error) {
        this.logger.error(error, 'Failed to update status on disconnect');
      }
    } else {
      this.userConnections.set(user.sub, count);
    }
  }

  private cleanupUserCalls(userId: string) {
    const callId = this.userActiveCalls.get(userId);
    if (!callId) return;

    const dmCall = this.dmCalls.get(callId);
    if (dmCall) {
      clearTimeout(dmCall.timeout);
      const otherUserId =
        dmCall.callerId === userId ? dmCall.receiverId : dmCall.callerId;
      this.server.to(otherUserId).emit('call:ended', {
        callId,
        reason: 'disconnect',
      });
      this.dmCalls.delete(callId);
      this.userActiveCalls.delete(otherUserId);
    }

    const groupCall = this.groupCalls.get(callId);
    if (groupCall) {
      const groupId = groupCall.groupId;
      groupCall.participants.delete(userId);
      const participantCount = groupCall.participants.size;
      this.server.to(`group:${groupId}`).emit('call:group-left', {
        callId,
        groupId,
        userId,
        participantCount,
      });
      if (participantCount === 0) {
        this.groupCalls.delete(callId);
        this.server.to(`group:${groupId}`).emit('call:group-call-ended', {
          groupId,
        });
      }
    }

    this.userActiveCalls.delete(userId);
  }

  // ── Direct Messages ──

  @SubscribeMessage('dm:send')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = createDirectMessageSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    if (this.isRateLimited(user.sub)) return;

    try {
      const friends = await this.userService.areFriends(
        user.sub,
        body.receiverId,
      );
      if (!friends) return;
    } catch (error) {
      this.logger.error(error, 'Failed to check friendship for DM');
      return;
    }

    const payload = {
      id: body.id,
      content: body.content,
      receiverId: body.receiverId,
      senderId: user.sub,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies DirectMessage;

    this.server.to(body.receiverId).emit('dm:receive', payload);
    client.emit('dm:receive', payload);

    this.directMessageService
      .create({
        id: body.id,
        receiverId: body.receiverId,
        content: body.content,
        senderId: user.sub,
      })
      .catch((err: unknown) => {
        this.logger.error(err, 'Failed to persist DM');
      });
  }

  @SubscribeMessage('dm:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = dmTypingSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;
    this.server.to(body.receiverId).emit('dm:typing', {
      userId: user.sub,
      isTyping: body.isTyping,
    });
  }

  @SubscribeMessage('user:profile-update')
  async handleProfileUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = profileUpdateSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    try {
      const friendIds = await this.userService.getFriendIds(user.sub);
      const payload = { userId: user.sub, ...body };
      for (const friendId of friendIds) {
        this.server.to(friendId).emit('user:profile-update', payload);
      }
    } catch (error) {
      this.logger.error(error, 'Failed to broadcast profile update');
    }
  }

  // ── Group Chat ──

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

    try {
      const isMember = await this.groupChatService.isMember(
        body.groupId,
        user.sub,
      );
      if (!isMember) return;
    } catch (error) {
      this.logger.error(error, 'Failed to check group membership');
      return;
    }

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

    try {
      const isMember = await this.groupChatService.isMember(
        body.groupId,
        user.sub,
      );
      if (!isMember) return;
    } catch (error) {
      this.logger.error(error, 'Failed to check group membership for typing');
      return;
    }

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

    try {
      const isMember = await this.groupChatService.isMember(
        body.groupId,
        user.sub,
      );
      if (!isMember) return;
    } catch (error) {
      this.logger.error(error, 'Failed to check group membership for join');
      return;
    }

    void client.join(`group:${body.groupId}`);
  }

  // ── Call Signaling (1-on-1) ──

  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callInitiateSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    if (this.userActiveCalls.has(user.sub)) {
      client.emit('call:error', { message: 'Already in a call' });
      return;
    }

    if (this.userActiveCalls.has(body.receiverId)) {
      client.emit('call:error', { message: 'User is already in a call' });
      return;
    }

    try {
      const friends = await this.userService.areFriends(
        user.sub,
        body.receiverId,
      );
      if (!friends) {
        client.emit('call:error', { message: 'Not friends' });
        return;
      }
    } catch (error) {
      this.logger.error(error, 'Failed to check friendship for call');
      client.emit('call:error', { message: 'Server error' });
      return;
    }

    const callId = crypto.randomUUID();

    const timeout = setTimeout(() => {
      const call = this.dmCalls.get(callId);
      if (call && call.status === 'ringing') {
        this.server
          .to(call.callerId)
          .emit('call:ended', { callId, reason: 'no-answer' });
        this.server
          .to(call.receiverId)
          .emit('call:ended', { callId, reason: 'no-answer' });
        this.dmCalls.delete(callId);
        this.userActiveCalls.delete(call.callerId);
        this.userActiveCalls.delete(call.receiverId);
      }
    }, 30_000);

    const call: DmCall = {
      id: callId,
      callerId: user.sub,
      callerName: user.userName ?? 'Unknown',
      receiverId: body.receiverId,
      callType: body.callType,
      status: 'ringing',
      timeout,
    };

    this.dmCalls.set(callId, call);
    this.userActiveCalls.set(user.sub, callId);
    this.userActiveCalls.set(body.receiverId, callId);

    // Tell the caller their callId
    client.emit('call:ringing', { callId });

    this.server.to(body.receiverId).emit('call:incoming', {
      callId,
      callerId: user.sub,
      callerName: call.callerName,
      callType: body.callType,
    });
  }

  @SubscribeMessage('call:accept')
  handleCallAccept(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callIdSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;
    const call = this.dmCalls.get(body.callId);
    if (!call || call.receiverId !== user.sub || call.status !== 'ringing')
      return;

    clearTimeout(call.timeout);
    call.status = 'active';

    this.server.to(call.callerId).emit('call:accepted', {
      callId: body.callId,
      userId: user.sub,
    });
  }

  @SubscribeMessage('call:decline')
  handleCallDecline(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callIdSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;
    const call = this.dmCalls.get(body.callId);
    if (!call || call.receiverId !== user.sub || call.status !== 'ringing')
      return;

    clearTimeout(call.timeout);
    this.server.to(call.callerId).emit('call:declined', {
      callId: body.callId,
      userId: user.sub,
    });
    this.dmCalls.delete(body.callId);
    this.userActiveCalls.delete(call.callerId);
    this.userActiveCalls.delete(call.receiverId);
  }

  @SubscribeMessage('call:hangup')
  handleCallHangup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callIdSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    const dmCall = this.dmCalls.get(body.callId);
    if (dmCall) {
      clearTimeout(dmCall.timeout);
      const otherUserId =
        dmCall.callerId === user.sub ? dmCall.receiverId : dmCall.callerId;
      this.server
        .to(otherUserId)
        .emit('call:ended', { callId: body.callId, reason: 'hangup' });
      this.dmCalls.delete(body.callId);
      this.userActiveCalls.delete(dmCall.callerId);
      this.userActiveCalls.delete(dmCall.receiverId);
      return;
    }

    // Could be a group call hangup via call:hangup
    const groupCall = this.groupCalls.get(body.callId);
    if (groupCall) {
      groupCall.participants.delete(user.sub);
      this.userActiveCalls.delete(user.sub);
      this.server
        .to(`group:${groupCall.groupId}`)
        .emit('call:group-left', { callId: body.callId, userId: user.sub });
      if (groupCall.participants.size === 0) {
        this.groupCalls.delete(body.callId);
      }
    }
  }

  @SubscribeMessage('call:offer')
  handleCallOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callOfferSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;
    this.server.to(body.toUserId).emit('call:offer', {
      callId: body.callId,
      fromUserId: user.sub,
      offer: body.offer,
    });
  }

  @SubscribeMessage('call:answer')
  handleCallAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callAnswerSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;
    this.server.to(body.toUserId).emit('call:answer', {
      callId: body.callId,
      fromUserId: user.sub,
      answer: body.answer,
    });
  }

  @SubscribeMessage('call:ice-candidate')
  handleCallIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callIceCandidateSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;
    this.server.to(body.toUserId).emit('call:ice-candidate', {
      callId: body.callId,
      fromUserId: user.sub,
      candidate: body.candidate,
    });
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

    const dmCall = this.dmCalls.get(body.callId);
    if (dmCall) {
      const otherUserId =
        dmCall.callerId === user.sub ? dmCall.receiverId : dmCall.callerId;
      this.server.to(otherUserId).emit('call:media-state', {
        userId: user.sub,
        audioEnabled: body.audioEnabled,
        videoEnabled: body.videoEnabled,
      });
      return;
    }

    const groupCall = this.groupCalls.get(body.callId);
    if (groupCall) {
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

  // ── Call Signaling (Group) ──

  @SubscribeMessage('call:group-join')
  async handleGroupCallJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callGroupJoinSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    if (this.userActiveCalls.has(user.sub)) {
      client.emit('call:error', { message: 'Already in a call' });
      return;
    }

    try {
      const isMember = await this.groupChatService.isMember(
        body.groupId,
        user.sub,
      );
      if (!isMember) {
        client.emit('call:error', { message: 'Not a group member' });
        return;
      }
    } catch (error) {
      this.logger.error(error, 'Failed to check group membership for call');
      client.emit('call:error', { message: 'Server error' });
      return;
    }

    // Find or create the group call
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

    // Tell the joiner who's already in the call
    const existingParticipants = Array.from(
      groupCall.participants.entries(),
    ).map(([userId, info]) => ({ userId, userName: info.userName }));

    client.emit('call:group-active', {
      callId: groupCall.id,
      participants: existingParticipants,
    });

    const userName = user.userName ?? 'Unknown';
    groupCall.participants.set(user.sub, { userName });
    this.userActiveCalls.set(user.sub, groupCall.id);

    const participantCount = groupCall.participants.size;

    // First joiner: notify whole group that a call started
    if (participantCount === 1) {
      this.server.to(`group:${body.groupId}`).emit('call:group-call-started', {
        groupId: body.groupId,
        callId: groupCall.id,
        participantCount: 1,
      });
    } else {
      // Notify existing participants (excludes sender)
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
  handleGroupCallLeave(
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
    this.userActiveCalls.delete(user.sub);
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
}
