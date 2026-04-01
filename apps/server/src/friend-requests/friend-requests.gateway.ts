import { Logger } from '@nestjs/common';
import {
  Ack,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { db } from '@repo/db';
import type {
  FriendRequestActionResult,
  FriendRequestUpdate,
} from '@repo/types';
import { AddFriendSchema, TokenPayloadSchema, z } from '@repo/zod';
import { Server, Socket } from 'socket.io';
import { TokenService } from 'src/auth/token.service';
import { corsConfig } from 'src/config/cors';

interface AuthenticatedSocket extends Socket {
  data: {
    user: z.infer<typeof TokenPayloadSchema>;
  };
}

@WebSocketGateway({ cors: corsConfig })
export class FriendRequestsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(FriendRequestsGateway.name);

  @WebSocketServer()
  declare server: Server;

  constructor(private readonly tokenService: TokenService) {}

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
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('friend:request')
  async handleFriendRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
    @Ack() ack: (result: FriendRequestActionResult) => void,
  ) {
    const result = AddFriendSchema.safeParse(raw);
    if (!result.success) {
      ack({ success: false, error: 'Validation failed on server!' });
      return;
    }

    const body = result.data;
    const user = client.data.user;

    try {
      const existingFriend = await db.user.findUnique({
        where: { userName: body.userName },
        select: {
          id: true,
          userName: true,
          name: true,
          avatarConfig: true,
        },
      });

      if (!existingFriend) {
        ack({ success: false, error: "That account doesn't exist!" });
        return;
      }

      if (user.sub === existingFriend.id) {
        ack({ success: false, error: "You can't add yourself!" });
        return;
      }

      const currentUser = await db.user.findUnique({
        where: { id: user.sub },
        select: {
          id: true,
          userName: true,
          name: true,
          avatarConfig: true,
          friends: {
            where: { id: existingFriend.id },
            select: { id: true },
          },
          friendOf: {
            where: { id: existingFriend.id },
            select: { id: true },
          },
        },
      });

      if (!currentUser) {
        ack({ success: false, error: 'Not authenticated!' });
        return;
      }

      const hasOutgoingRequest = currentUser.friends.length > 0;
      const hasIncomingRequest = currentUser.friendOf.length > 0;

      if (hasOutgoingRequest && hasIncomingRequest) {
        ack({
          success: false,
          error: "Friend request already sent or you're already friends.",
        });
        return;
      }

      if (hasOutgoingRequest) {
        ack({ success: false, error: 'Friend request already sent.' });
        return;
      }

      if (hasIncomingRequest) {
        ack({
          success: false,
          error: 'This user already sent you a request. Accept it instead.',
        });
        return;
      }

      await db.user.update({
        where: { id: user.sub },
        data: {
          friends: {
            connect: { id: existingFriend.id },
          },
        },
      });

      const outgoingPayload: FriendRequestUpdate = {
        direction: 'outgoing',
        friend: {
          id: existingFriend.id,
          userName: existingFriend.userName,
          name: existingFriend.name,
          avatarConfig: existingFriend.avatarConfig,
        },
      };
      const incomingPayload: FriendRequestUpdate = {
        direction: 'incoming',
        friend: {
          id: currentUser.id,
          userName: currentUser.userName,
          name: currentUser.name,
          avatarConfig: currentUser.avatarConfig,
        },
      };

      this.server.to(user.sub).emit('friend:request', outgoingPayload);
      this.server.to(existingFriend.id).emit('friend:request', incomingPayload);
      ack({ success: true });
    } catch (error) {
      this.logger.error(error, 'Failed to create friend request');
      ack({ success: false, error: 'Server error' });
    }
  }
}
