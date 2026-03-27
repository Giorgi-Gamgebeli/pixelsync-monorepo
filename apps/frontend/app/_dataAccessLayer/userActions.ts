"use server";

import { auth } from "@/auth";
import { db } from "@repo/db";
import {
  AcceptFriendRequestSchema,
  AddFriendSchema,
  CancelFriendRequestSchema,
  DeclineFriendRequestSchema,
  GetDirectMessagesSchema,
  GetFriendSchema,
  UnfriendSchema,
  UpdateAvatarConfigSchema,
  UpdateUserNameSchema,
  updateStatusSchema,
} from "@repo/zod";
import { z } from "zod";
import { handleErrorsOnServer, OperationalError } from "../_utils/helpers";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { cache } from "react";

export const getFriends = cache(async function getFriends() {
  try {
    const session = await auth();
    // ... [Original getFriends body omitted as it will be preserved by StartLine trick]
    if (!session) throw new OperationalError("Not authenticated!");

    const userWithFriends = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        friends: {
          select: {
            id: true,
            userName: true,
            status: true,
            avatarConfig: true,
          },
        },
        friendOf: {
          select: {
            id: true,
            userName: true,
            status: true,
            avatarConfig: true,
          },
        },
      },
    });

    const friends = userWithFriends?.friends || [];
    const friendOf = userWithFriends?.friendOf || [];

    // Create sets of IDs for fast comparison
    const friendIds = new Set(friends.map((f) => f.id));
    const mutualFriends = friendOf.filter((f) => friendIds.has(f.id));

    return mutualFriends;
  } catch (error) {
    return handleErrorsOnServer(error);
  }
});

export async function getFriend(values: z.infer<typeof GetFriendSchema>) {
  try {
    const res = GetFriendSchema.safeParse(values);
    if (res.error) throw new OperationalError("Validation failed on server!");
    const { id } = res.data;

    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    const friend = await db.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userName: true,
        status: true,
        avatarConfig: true,

        friends: {
          where: {
            id: session.user.id,
          },
        },
        friendOf: {
          where: {
            id: session.user.id,
          },
        },
      },
    });

    if (id === session.user.id) {
      throw new OperationalError("You cannot perform this action on yourself.");
    }

    if (!friend) throw new OperationalError("Friend was not found!");

    const isFriend = friend.friends.length > 0 && friend.friendOf.length > 0;

    if (!isFriend)
      throw new OperationalError("You are not friends with this user!");

    return {
      id: friend.id,
      userName: friend.userName,
      status: friend.status,
      avatarConfig: friend.avatarConfig,
    };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function getDirectMessages(
  values: z.infer<typeof GetDirectMessagesSchema>,
) {
  try {
    const res = GetDirectMessagesSchema.safeParse(values);
    if (res.error) throw new OperationalError("Validation failed on server!");
    const { id } = res.data;

    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    const friend = await db.user.findUnique({
      where: {
        id,
      },
      select: {
        friends: {
          where: {
            id: session.user.id,
          },
        },
        friendOf: {
          where: {
            id: session.user.id,
          },
        },
      },
    });

    if (id === session.user.id) {
      throw new OperationalError("You cannot perform this action on yourself.");
    }

    if (!friend) throw new OperationalError("Friend was not found!");

    const isFriend = friend.friends.length > 0 && friend.friendOf.length > 0;

    if (!isFriend)
      throw new OperationalError("You are not friends with this user!");

    const messages = await db.directMessage.findMany({
      where: {
        OR: [
          { receiverId: id, senderId: session.user.id },
          { receiverId: session.user.id, senderId: id },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return messages.toReversed().map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function getChatPageData(friendId: string) {
  try {
    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    if (friendId === session.user.id) {
      throw new OperationalError("You cannot perform this action on yourself.");
    }

    const [friend, currentUser, messages] = await Promise.all([
      db.user.findUnique({
        where: { id: friendId },
        select: {
          id: true,
          userName: true,
          status: true,
          avatarConfig: true,
          friends: { where: { id: session.user.id } },
          friendOf: { where: { id: session.user.id } },
        },
      }),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { avatarConfig: true },
      }),
      db.directMessage.findMany({
        where: {
          OR: [
            { receiverId: friendId, senderId: session.user.id },
            { receiverId: session.user.id, senderId: friendId },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    if (!friend) throw new OperationalError("Friend was not found!");

    const isFriend = friend.friends.length > 0 && friend.friendOf.length > 0;
    if (!isFriend)
      throw new OperationalError("You are not friends with this user!");

    return {
      session,
      friend: {
        id: friend.id,
        userName: friend.userName,
        status: friend.status,
        avatarConfig: friend.avatarConfig,
      },
      currentUserAvatarConfig: currentUser?.avatarConfig ?? null,
      messages: messages.toReversed().map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function getPendingFriendRequests() {
  try {
    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    const currentUserFriends = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        friends: {
          select: {
            id: true,
            userName: true,
            name: true,
            avatarConfig: true,
          },
        },
        friendOf: {
          select: {
            id: true,
            userName: true,
            name: true,
            avatarConfig: true,
          },
        },
      },
    });

    const friendsIDs = new Set(currentUserFriends?.friends.map((f) => f.id));
    const friendOfIDs = new Set(currentUserFriends?.friendOf.map((f) => f.id));

    const friendRequestsToThem =
      currentUserFriends?.friends.filter((f) => !friendOfIDs.has(f.id)) || [];

    const friendRequestsToMe =
      currentUserFriends?.friendOf.filter((f) => !friendsIDs.has(f.id)) || [];

    return { friendRequestsToThem, friendRequestsToMe };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function addFriend(values: z.infer<typeof AddFriendSchema>) {
  try {
    const result = AddFriendSchema.safeParse(values);
    if (result.error)
      throw new OperationalError("Validation failed on server!");
    const { userName } = result.data;

    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    const currentUserId = session.user.id;

    const existingFriend = await db.user.findUnique({
      where: {
        userName,
      },
    });

    if (!existingFriend)
      throw new OperationalError("That account doesn't exist!");
    if (currentUserId === existingFriend.id)
      throw new OperationalError("You can't add yourself!");

    const alreadyFriend = await db.user.findUnique({
      where: {
        id: currentUserId,
        friends: {
          some: {
            id: existingFriend.id,
          },
        },
      },
    });

    if (alreadyFriend)
      throw new OperationalError("This person is already your friend!");

    await db.user.update({
      where: {
        id: currentUserId,
      },
      data: {
        friends: {
          connect: {
            id: existingFriend.id,
          },
        },
      },
    });
  } catch (error) {
    return handleErrorsOnServer(error);
  } finally {
    revalidatePath("/home/friends");
  }
}

export async function cancelFriendRequest(
  values: z.infer<typeof CancelFriendRequestSchema>,
) {
  try {
    const result = CancelFriendRequestSchema.safeParse(values);
    if (result.error)
      throw new OperationalError("Validation failed on server!");
    const { id } = result.data;

    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        friends: {
          disconnect: {
            id,
          },
        },
      },
    });
  } catch (error) {
    return handleErrorsOnServer(error);
  } finally {
    revalidatePath("/home/friends");
  }
}

export async function declineFriendRequest(
  values: z.infer<typeof DeclineFriendRequestSchema>,
) {
  try {
    const result = DeclineFriendRequestSchema.safeParse(values);
    if (result.error)
      throw new OperationalError("Validation failed on server!");
    const { id } = result.data;

    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    await db.user.update({
      where: {
        id,
      },
      data: {
        friends: {
          disconnect: {
            id: session.user.id,
          },
        },
      },
    });
  } catch (error) {
    return handleErrorsOnServer(error);
  } finally {
    revalidatePath("/home/friends");
  }
}

export async function acceptFriendRequest(
  values: z.infer<typeof AcceptFriendRequestSchema>,
) {
  try {
    const result = AcceptFriendRequestSchema.safeParse(values);
    if (result.error)
      throw new OperationalError("Validation failed on server!");
    const { id } = result.data;

    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        friends: {
          connect: {
            id,
          },
        },
      },
    });
  } catch (error) {
    return handleErrorsOnServer(error);
  } finally {
    revalidatePath("/home", "layout");
  }
}

export async function updateAvatarConfig(
  values: z.infer<typeof UpdateAvatarConfigSchema>,
) {
  try {
    const result = UpdateAvatarConfigSchema.safeParse(values);
    if (result.error)
      throw new OperationalError("Validation failed on server!");
    const { avatarConfig } = result.data;

    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        avatarConfig,
      },
    });
  } catch (error) {
    return handleErrorsOnServer(error);
  } finally {
    revalidatePath("/", "layout"); // Revalidate entire app to update all avatars immediately
  }
}

export async function updateUserName(
  values: z.infer<typeof UpdateUserNameSchema>,
) {
  try {
    const result = UpdateUserNameSchema.safeParse(values);
    if (result.error)
      throw new OperationalError(
        result.error.issues[0]?.message || "Validation failed!",
      );
    const { userName } = result.data;

    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    const existing = await db.user.findUnique({
      where: { userName },
      select: { id: true },
    });

    if (existing && existing.id !== session.user.id) {
      throw new OperationalError("Username already taken!");
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { userName },
    });
  } catch (error) {
    return handleErrorsOnServer(error);
  } finally {
    revalidatePath("/", "layout");
  }
}

export async function updateDisplayName(name: string) {
  try {
    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    await db.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() || null },
    });
  } catch (error) {
    return handleErrorsOnServer(error);
  } finally {
    revalidatePath("/", "layout");
  }
}

export async function unfriend(values: z.infer<typeof UnfriendSchema>) {
  try {
    const result = UnfriendSchema.safeParse(values);
    if (result.error)
      throw new OperationalError("Validation failed on server!");
    const { id } = result.data;

    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");

    if (id === session.user.id) {
      throw new OperationalError("You cannot unfriend yourself.");
    }

    await db.$transaction([
      db.user.update({
        where: { id: session.user.id },
        data: { friends: { disconnect: { id } } },
      }),
      db.user.update({
        where: { id },
        data: { friends: { disconnect: { id: session.user.id } } },
      }),
    ]);
  } catch (error) {
    return handleErrorsOnServer(error);
  } finally {
    revalidatePath("/home", "layout");
  }
}

export async function getWsToken() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new OperationalError("Not authenticated!");

    const cookieStore = await cookies();
    // Auth.js uses different cookie names based on environment/SSL
    const secureCookie = cookieStore.get("__Secure-authjs.session-token");
    const regularCookie = cookieStore.get("authjs.session-token");
    const cookie = secureCookie || regularCookie;

    if (!cookie) throw new OperationalError("No session token found");

    return {
      token: cookie.value,
      salt: cookie.name,
    };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function updateStatus(values: z.infer<typeof updateStatusSchema>) {
  try {
    const result = updateStatusSchema.safeParse(values);
    if (result.error)
      throw new OperationalError("Validation failed on server!");
    const { userId, status } = result.data;

    const session = await auth();
    if (!session) throw new OperationalError("Not authenticated!");
    if (session.user.id !== userId)
      throw new OperationalError("Not authorized!");

    await db.user.update({
      where: { id: userId },
      data: { status },
    });
  } catch (error) {
    return handleErrorsOnServer(error);
  } finally {
    revalidatePath("/", "layout");
  }
}
