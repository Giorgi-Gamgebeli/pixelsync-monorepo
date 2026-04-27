import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { corsConfig } from 'src/config/cors';
import { TokenService } from 'src/auth/token.service';
import { UsersService } from 'src/users/users.service';
import { PresenceService } from 'src/presence/presence.service';
import { SocketService } from './socket.service';
import type { AuthenticatedSocket } from 'src/presence/presence.types';

@WebSocketGateway({ cors: corsConfig })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SocketGateway.name);

  @WebSocketServer()
  declare server: Server;

  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
    private readonly presenceService: PresenceService,
    private readonly socketService: SocketService,
  ) {}

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

      // Register presence
      const { firstConnection } = await this.presenceService.registerSocket(
        client,
        user.sub,
      );

      if (firstConnection) {
        this.presenceService.broadcastStatus(this.server, user.sub, 'ONLINE');
        await this.usersService.updateStatus({
          userId: user.sub,
          status: 'ONLINE',
        });
      }

      // Join group rooms
      try {
        const groupIds = await this.usersService.getGroupIds(user.sub);
        for (const gid of groupIds) {
          await client.join(`group:${gid}`);
        }
      } catch (error) {
        this.logger.error(error, 'Failed to join group rooms for user');
      }
    } catch (error) {
      this.logger.error(error, 'Socket connection failed');
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user) return;

    const { lastConnection } = await this.presenceService.unregisterSocket(
      client,
      user.sub,
    );

    if (lastConnection) {
      try {
        await this.usersService.updateStatus({
          userId: user.sub,
          status: 'OFFLINE',
        });
        this.presenceService.broadcastStatus(this.server, user.sub, 'OFFLINE');
      } catch (error) {
        this.logger.error(error, 'Failed to update status on disconnect');
      }
    }

    // Trigger cleanup hooks across all modules (DMs, Group Calls, etc.)
    await this.socketService.runDisconnectHooks(user.sub, lastConnection);
  }
}
