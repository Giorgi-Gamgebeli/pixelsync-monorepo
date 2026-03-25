import { handleErrorsOnServer, OperationalError } from "@/app/_utils/helpers";
import { db } from "@repo/db";
import type { DirectMessage, UserStatus } from "@repo/types";

type DMChatPageData = {
  friend: {
    id: string;
    userName: string | null;
    status: UserStatus;
    avatarConfig: string | null;
  };
  messages: DirectMessage[];
};

export async function getCachedDMChatPageData(
  friendId: string,
  userId: string,
): Promise<DMChatPageData | { error: string }> {
  try {
    if (friendId === userId) {
      throw new OperationalError("You cannot perform this action on yourself.");
    }

    const [friend, messages] = await Promise.all([
      db.user.findUnique({
        where: { id: friendId },
        select: {
          id: true,
          userName: true,
          status: true,
          avatarConfig: true,
          friends: { where: { id: userId } },
          friendOf: { where: { id: userId } },
        },
      }),
      db.directMessage.findMany({
        where: {
          OR: [
            { receiverId: friendId, senderId: userId },
            { receiverId: userId, senderId: friendId },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    if (!friend) throw new OperationalError("Friend was not found!");

    const isFriend = friend.friends.length > 0 && friend.friendOf.length > 0;
    if (!isFriend) {
      throw new OperationalError("You are not friends with this user!");
    }

    return {
      friend: {
        id: friend.id,
        userName: friend.userName,
        status: friend.status,
        avatarConfig: friend.avatarConfig,
      },
      messages: messages.toReversed().map((message) => ({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        isRead: message.isRead,
      })),
    };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export type { DMChatPageData };
