import { Logger, OnModuleDestroy } from '@nestjs/common';
import {
  Ack,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type {
  CallType,
  DirectMessage,
  ProfileUpdate,
  UserStatus,
} from '@repo/types';
import {
  callAnswerSchema,
  callIceCandidateSchema,
  callIdSchema,
  callInitiateSchema,
  callMediaStateSchema,
  callOfferSchema,
  createDirectMessageSchema,
  dmTypingSchema,
  profileUpdateSchema,
  TokenPayloadSchema,
  z,
} from '@repo/zod';
import { Server, Socket } from 'socket.io';
import { TokenService } from 'src/auth/token.service';
import { CallStateService } from 'src/call-state/call-state.service';
import { corsConfig } from 'src/config/cors';
import { UsersService } from 'src/users/users.service';
import { DirectMessageService } from './direct-message.service';
import { handleSocketError } from 'src/utils/handleErrors';

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

const userStatusValues = [
  'ONLINE',
  'OFFLINE',
  'IDLE',
  'DO_NOT_DISTURB',
] as const;

const setStatusSchema = z.object({
  status: z.enum(userStatusValues),
});

@WebSocketGateway({ cors: corsConfig })
export class DirectMessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(DirectMessageGateway.name);

  @WebSocketServer()
  declare server: Server;

  private readonly dmCalls = new Map<string, DmCall>();
  private readonly dmCallByUser = new Map<string, string>();
  private readonly userConnections = new Map<string, number>();
  private readonly socketIdsByUser = new Map<string, Set<string>>();
  private readonly presenceSubscriptionsBySocket = new Map<
    string,
    Set<string>
  >();
  private readonly messageLimits = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly MESSAGE_RATE_LIMIT = 9999;
  private readonly MESSAGE_RATE_WINDOW = 5_000;
  private readonly rateLimitCleanupTimer: ReturnType<typeof setInterval>;

  constructor(
    private readonly directMessageService: DirectMessageService,
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
    private readonly callState: CallStateService,
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

  private async syncPresenceSubscriptionsForSocket(
    client: AuthenticatedSocket,
    userId: string,
  ) {
    const desiredPresenceTargets = new Set<string>();
    const friendIds = await this.userService.getFriendIds(userId);

    for (const friendId of friendIds) {
      if (friendId === userId) continue;
      desiredPresenceTargets.add(friendId);
    }

    const previousTargets =
      this.presenceSubscriptionsBySocket.get(client.id) ?? new Set<string>();

    for (const targetUserId of previousTargets) {
      if (desiredPresenceTargets.has(targetUserId)) continue;
      void client.leave(`presence:${targetUserId}`);
    }

    for (const targetUserId of desiredPresenceTargets) {
      if (previousTargets.has(targetUserId)) continue;
      void client.join(`presence:${targetUserId}`);
    }

    this.presenceSubscriptionsBySocket.set(client.id, desiredPresenceTargets);
  }

  async resyncPresenceForUsers(userIds: string[]) {
    const uniqueUserIds = Array.from(
      new Set(userIds.filter((userId) => userId.length > 0)),
    );

    for (const userId of uniqueUserIds) {
      const socketIds = this.socketIdsByUser.get(userId);
      if (!socketIds?.size) continue;

      for (const socketId of socketIds) {
        const socket = this.server.sockets.sockets.get(socketId) as
          | AuthenticatedSocket
          | undefined;
        if (!socket) continue;

        try {
          await this.syncPresenceSubscriptionsForSocket(socket, userId);
        } catch (error) {
          this.logger.error(error, 'Failed to resync presence for socket');
        }
      }
    }
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
      const socketIdsForUser = this.socketIdsByUser.get(user.sub) ?? new Set();
      socketIdsForUser.add(client.id);
      this.socketIdsByUser.set(user.sub, socketIdsForUser);

      try {
        await this.syncPresenceSubscriptionsForSocket(client, user.sub);
      } catch (error) {
        this.logger.error(error, 'Failed to sync presence subscriptions');
      }

      const prevCount = this.userConnections.get(user.sub) ?? 0;
      this.userConnections.set(user.sub, prevCount + 1);

      if (prevCount === 0) {
        await this.userService.updateStatus({
          userId: user.sub,
          status: 'ONLINE',
        });
        this.broadcastStatus(user.sub, 'ONLINE');
      }
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user) return;

    this.presenceSubscriptionsBySocket.delete(client.id);
    const socketIdsForUser = this.socketIdsByUser.get(user.sub);
    if (socketIdsForUser) {
      socketIdsForUser.delete(client.id);
      if (socketIdsForUser.size === 0) {
        this.socketIdsByUser.delete(user.sub);
      }
    }
    this.cleanupDmCalls(user.sub);

    const count = (this.userConnections.get(user.sub) ?? 1) - 1;
    if (count <= 0) {
      this.userConnections.delete(user.sub);
      this.messageLimits.delete(user.sub);

      try {
        await this.userService.updateStatus({
          userId: user.sub,
          status: 'OFFLINE',
        });
        this.broadcastStatus(user.sub, 'OFFLINE');
      } catch (error) {
        this.logger.error(error, 'Failed to update status on disconnect');
      }
    } else {
      this.userConnections.set(user.sub, count);
    }
  }

  private broadcastStatus(userId: string, status: UserStatus) {
    const payload = { userId, status };
    this.server.to(userId).emit('user:status', payload);
    this.server.to(`presence:${userId}`).emit('user:status', payload);
  }

  private broadcastProfileUpdate(
    userId: string,
    data: Omit<ProfileUpdate, 'userId'>,
  ) {
    const payload: ProfileUpdate = { userId, ...data };
    this.server.to(userId).emit('user:profile-update', payload);
    this.server.to(`presence:${userId}`).emit('user:profile-update', payload);
  }

  private cleanupDmCalls(userId: string) {
    const callId = this.dmCallByUser.get(userId);
    if (!callId) return;

    const dmCall = this.dmCalls.get(callId);
    this.dmCallByUser.delete(userId);
    this.callState.clearCall(userId, callId);

    if (!dmCall) return;

    clearTimeout(dmCall.timeout);
    const otherUserId =
      dmCall.callerId === userId ? dmCall.receiverId : dmCall.callerId;
    this.server.to(otherUserId).emit('call:ended', {
      callId,
      reason: 'disconnect',
    });

    this.dmCalls.delete(callId);
    this.dmCallByUser.delete(dmCall.callerId);
    this.dmCallByUser.delete(dmCall.receiverId);
    this.callState.clearCall(dmCall.callerId, callId);
    this.callState.clearCall(dmCall.receiverId, callId);
  }

  @SubscribeMessage('dm:send')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
    @Ack() ack: (result: { success: boolean; error: string }) => void,
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
      if (!friends) throw new Error('Failed to check friendship for DM');

      const payload: DirectMessage = {
        id: body.id,
        content: body.content,
        receiverId: body.receiverId,
        senderId: user.sub,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.server.to(body.receiverId).emit('dm:receive', payload);
      this.server.to(user.sub).emit('dm:receive', payload);

      await this.directMessageService.create({
        id: body.id,
        receiverId: body.receiverId,
        content: body.content,
        senderId: user.sub,
      });
    } catch (error) {
      handleSocketError({ error, ack, logger: this.logger });
    }
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
  handleProfileUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = profileUpdateSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    this.broadcastProfileUpdate(user.sub, body);
  }

  @SubscribeMessage('user:set-status')
  async handleSetStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = setStatusSchema.safeParse(raw);
    if (!result.success) return;

    const body = result.data;
    const user = client.data.user;

    try {
      await this.userService.updateStatus({
        userId: user.sub,
        status: body.status,
      });
      this.broadcastStatus(user.sub, body.status);
    } catch (error) {
      this.logger.error(error, 'Failed to update status');
    }
  }

  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ) {
    const result = callInitiateSchema.safeParse(raw);
    if (!result.success) return;
    const body = result.data;
    const user = client.data.user;

    if (this.callState.isActive(user.sub)) {
      client.emit('call:error', { message: 'Already in a call' });
      return;
    }

    if (this.callState.isActive(body.receiverId)) {
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
      if (call?.status === 'ringing') {
        this.server
          .to(call.callerId)
          .emit('call:ended', { callId, reason: 'no-answer' });
        this.server
          .to(call.receiverId)
          .emit('call:ended', { callId, reason: 'no-answer' });
        this.dmCalls.delete(callId);
        this.dmCallByUser.delete(call.callerId);
        this.dmCallByUser.delete(call.receiverId);
        this.callState.clearCall(call.callerId, callId);
        this.callState.clearCall(call.receiverId, callId);
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
    this.dmCallByUser.set(user.sub, callId);
    this.dmCallByUser.set(body.receiverId, callId);
    this.callState.setCall(user.sub, callId);
    this.callState.setCall(body.receiverId, callId);

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
    if (call?.receiverId !== user.sub || call.status !== 'ringing') return;

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
    if (call?.receiverId !== user.sub || call.status !== 'ringing') return;

    clearTimeout(call.timeout);
    this.server.to(call.callerId).emit('call:declined', {
      callId: body.callId,
      userId: user.sub,
    });
    this.dmCalls.delete(body.callId);
    this.dmCallByUser.delete(call.callerId);
    this.dmCallByUser.delete(call.receiverId);
    this.callState.clearCall(call.callerId, body.callId);
    this.callState.clearCall(call.receiverId, body.callId);
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
    if (!dmCall) return;

    clearTimeout(dmCall.timeout);
    const otherUserId =
      dmCall.callerId === user.sub ? dmCall.receiverId : dmCall.callerId;
    this.server
      .to(otherUserId)
      .emit('call:ended', { callId: body.callId, reason: 'hangup' });
    this.dmCalls.delete(body.callId);
    this.dmCallByUser.delete(dmCall.callerId);
    this.dmCallByUser.delete(dmCall.receiverId);
    this.callState.clearCall(dmCall.callerId, body.callId);
    this.callState.clearCall(dmCall.receiverId, body.callId);
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
    if (!dmCall) return;

    const otherUserId =
      dmCall.callerId === user.sub ? dmCall.receiverId : dmCall.callerId;
    this.server.to(otherUserId).emit('call:media-state', {
      userId: user.sub,
      audioEnabled: body.audioEnabled,
      videoEnabled: body.videoEnabled,
    });
  }
}
