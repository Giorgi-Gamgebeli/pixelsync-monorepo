import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { createDirectMessageSchema, TokenPayloadSchema, z } from '@repo/zod';
import { decode } from '@auth/core/jwt';
import { Server, Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';
import { DirectMessageService } from './direct-message.service';
import { GroupChatService } from 'src/group-chat/group-chat.service';
import type { CallType } from '@repo/types';

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

@WebSocketGateway({
  cors: { origin: process.env.NEXT_PUBLIC_BASE_URL, credentials: true },
})
export class DirectMessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DirectMessageGateway.name);

  @WebSocketServer()
  declare server: Server;

  private dmCalls = new Map<string, DmCall>();
  private groupCalls = new Map<string, GroupCall>();
  private userActiveCalls = new Map<string, string>(); // userId -> callId

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

    this.cleanupUserCalls(user.sub);

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
        this.logger.error(err, 'Failed to persist DM');
      });
  }

  @SubscribeMessage('dm:read')
  handleRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { senderId: string },
  ) {
    const user = client.data.user;

    this.server.to(body.senderId).emit('dm:read-ack', { readBy: user.sub });

    this.directMessageService
      .markAsRead(body.senderId, user.sub)
      .catch((err) => {
        this.logger.error(err, 'Failed to mark as read');
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
    body: {
      userName?: string | null;
      name?: string | null;
      avatarConfig?: string | null;
    },
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

    if (
      !body.content ||
      typeof body.content !== 'string' ||
      !body.content.trim()
    )
      return;
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
        this.logger.error(err, 'Failed to persist group message');
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

  // ── Call Signaling (1-on-1) ──

  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { receiverId: string; callType: CallType },
  ) {
    const user = client.data.user;

    if (this.userActiveCalls.has(user.sub)) {
      client.emit('call:error', { message: 'Already in a call' });
      return;
    }

    if (this.userActiveCalls.has(body.receiverId)) {
      client.emit('call:error', { message: 'User is already in a call' });
      return;
    }

    const friends = await this.userService.areFriends(
      user.sub,
      body.receiverId,
    );
    if (!friends) {
      client.emit('call:error', { message: 'Not friends' });
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
    @MessageBody() body: { callId: string },
  ) {
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
    @MessageBody() body: { callId: string },
  ) {
    const user = client.data.user;
    const call = this.dmCalls.get(body.callId);
    if (!call || call.receiverId !== user.sub) return;

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
    @MessageBody() body: { callId: string },
  ) {
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
    @MessageBody()
    body: {
      callId: string;
      toUserId: string;
      offer: { type: string; sdp?: string };
    },
  ) {
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
    @MessageBody()
    body: {
      callId: string;
      toUserId: string;
      answer: { type: string; sdp?: string };
    },
  ) {
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
    @MessageBody()
    body: {
      callId: string;
      toUserId: string;
      candidate: {
        candidate?: string;
        sdpMid?: string | null;
        sdpMLineIndex?: number | null;
      };
    },
  ) {
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
    @MessageBody()
    body: { callId: string; audioEnabled: boolean; videoEnabled: boolean },
  ) {
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
    @MessageBody() body: { groupId: number; callType: CallType },
  ) {
    const user = client.data.user;

    if (this.userActiveCalls.has(user.sub)) {
      client.emit('call:error', { message: 'Already in a call' });
      return;
    }

    const isMember = await this.groupChatService.isMember(
      body.groupId,
      user.sub,
    );
    if (!isMember) {
      client.emit('call:error', { message: 'Not a group member' });
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
    @MessageBody() body: { callId: string },
  ) {
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
