"use server";

import { auth } from "@/auth";
import { db } from "./db";
import {
  AcceptFriendRequestSchema,
  AddFriendSchema,
  CancelFriendRequestSchema,
  DeclineFriendRequestSchema,
  GetDirectMessagesSchema,
  GetFriendSchema,
} from "../_schemas/schemas";
import { z } from "zod";
import { handleErrorsOnServer } from "../_utils/helpers";
import { revalidatePath } from "next/cache";

export async function getFriends() {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const userWithFriends = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        friends: {
          select: {
            id: true,
            userName: true,
            image: true,
            status: true,
          },
        },
        friendOf: {
          select: {
            id: true,
            userName: true,
            image: true,
            status: true,
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
    console.error("Failed to get mutual friends:", error);
    return [];
  }
}

export async function getFriend(values: z.infer<typeof GetFriendSchema>) {
  try {
    const res = GetFriendSchema.safeParse(values);
    if (res.error) throw new Error("Validation failed on server!");
    const { id } = res.data;

    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const friend = await db.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userName: true,
        image: true,
        status: true,

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

    if (!friend) throw new Error("Friend was not found!");

    const { friends, friendOf, ...friendValues } = friend;
    console.log(friend);
    console.log(friends, friendOf);
    if (!(friends.length && friendOf.length))
      throw new Error("You are not friends with this user!");

    return friendValues;
  } catch (error) {
    console.error(error);
  }
}

export async function getDirectMessages(
  values: z.infer<typeof GetDirectMessagesSchema>,
) {
  try {
    const res = GetDirectMessagesSchema.safeParse(values);
    if (res.error) throw new Error("Validaiton failed on server!");
    const { id } = res.data;

    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

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
            id,
          },
        },
      },
    });

    if (!friend) throw new Error("Friend was not found!");

    if (!(friend.friends.length && friend.friendOf.length))
      throw new Error("You are not friends with this user!");

    const messages = await db.directMessage.findMany({
      where: {
        OR: [
          { receiverId: id, senderId: session.user.id },
          { receiverId: session.user.id, senderId: id },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return messages;
  } catch (error) {
    console.error(error);
  }
}

export async function getPendingFriendRequests() {
  try {
    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const currentUserFriends = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        friends: {
          select: {
            id: true,
            userName: true,
            name: true,
            image: true,
          },
        },
        friendOf: {
          select: {
            id: true,
            userName: true,
            name: true,
            image: true,
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
    console.log(error);
  }
}

export async function addFriend(values: z.infer<typeof AddFriendSchema>) {
  try {
    const result = AddFriendSchema.safeParse(values);
    if (result.error) throw new Error("Validation failed on server!");
    const { userName } = result.data;

    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

    const currentUserId = session.user.id;

    const existingFriend = await db.user.findUnique({
      where: {
        userName,
      },
    });

    if (!existingFriend) throw new Error("That account doesn't exist!");
    if (currentUserId === existingFriend.id)
      throw new Error("You can't add yourself!");

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

    if (alreadyFriend) throw new Error("This person is already your friend!");

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
    if (result.error) throw new Error("Validation failed on server!");
    const { id } = result.data;

    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

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
    console.log(error);
  } finally {
    revalidatePath("/home/friends");
  }
}

export async function declineFriendRequest(
  values: z.infer<typeof DeclineFriendRequestSchema>,
) {
  try {
    const result = DeclineFriendRequestSchema.safeParse(values);
    if (result.error) throw new Error("Validation failed on server!");
    const { id } = result.data;

    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

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
    console.error(error);
  } finally {
    revalidatePath("/home/friends");
  }
}

export async function acceptFriendRequest(
  values: z.infer<typeof AcceptFriendRequestSchema>,
) {
  try {
    const result = AcceptFriendRequestSchema.safeParse(values);
    if (result.error) throw new Error("Validation failed on server!");
    const { id } = result.data;

    const session = await auth();
    if (!session) throw new Error("Not authenticated!");

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
    console.log(error);
  } finally {
    revalidatePath("/home", "layout");
  }
}
