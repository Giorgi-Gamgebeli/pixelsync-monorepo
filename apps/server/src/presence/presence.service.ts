import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from 'src/auth/token.service';
import { UserStatus } from '@repo/types';
import { Server } from 'socket.io';
import { UsersService } from 'src/users/users.service';
import { AuthenticatedSocket } from './presence.types';

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  private readonly userConnections = new Map<string, number>();
  private readonly socketIdsByUser = new Map<string, Set<string>>();
  private readonly presenceSubscriptionsBySocket = new Map<
    string,
    Set<string>
  >();

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async registerSocket(client: AuthenticatedSocket, userId: string) {
    await client.join(userId);

    const socketIdsForUser = this.socketIdsByUser.get(userId) ?? new Set();
    socketIdsForUser.add(client.id);
    this.socketIdsByUser.set(userId, socketIdsForUser);

    try {
      await this.syncPresenceSubscriptionsForSocket(client, userId);
    } catch (error) {
      this.logger.error(error, 'Failed to sync presence subscriptions');
    }

    const prevCount = this.userConnections.get(userId) ?? 0;
    this.userConnections.set(userId, prevCount + 1);

    return { firstConnection: prevCount === 0 };
  }

  async unregisterSocket(client: AuthenticatedSocket, userId: string) {
    this.presenceSubscriptionsBySocket.delete(client.id);

    const socketIdsForUser = this.socketIdsByUser.get(userId);
    if (socketIdsForUser) {
      socketIdsForUser.delete(client.id);
      if (socketIdsForUser.size === 0) {
        this.socketIdsByUser.delete(userId);
      }
    }

    const count = (this.userConnections.get(userId) ?? 1) - 1;
    if (count <= 0) {
      this.userConnections.delete(userId);
      return { lastConnection: true };
    }

    this.userConnections.set(userId, count);
    return { lastConnection: false };
  }

  broadcastStatus(server: Server, userId: string, status: UserStatus) {
    const payload = { userId, status };
    server.to(userId).emit('user:status', payload);
    server.to(`presence:${userId}`).emit('user:status', payload);
  }

  broadcastProfileUpdate(
    server: Server,
    userId: string,
    data: { userName?: string; name?: string; avatarConfig?: any },
  ) {
    const payload = { userId, ...data };
    server.to(userId).emit('user:profile-update', payload);
    server.to(`presence:${userId}`).emit('user:profile-update', payload);
  }

  async resyncPresenceForUsers(userIds: string[], server: Server) {
    const uniqueUserIds = Array.from(
      new Set(userIds.filter((userId) => userId.length > 0)),
    );

    for (const userId of uniqueUserIds) {
      const socketIds = this.socketIdsByUser.get(userId);
      if (!socketIds?.size) continue;

      for (const socketId of socketIds) {
        const socket = server.sockets.sockets.get(socketId) as
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

  private async syncPresenceSubscriptionsForSocket(
    client: AuthenticatedSocket,
    userId: string,
  ) {
    const desiredPresenceTargets = new Set<string>();
    const friendIds = await this.usersService.getFriendIds(userId);

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
}
