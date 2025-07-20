import { z } from "zod";

export const AddFriendSchema = z.object({
  userName: z.string({ message: "Only text is allowed" }),
});

export const CancelFriendRequestSchema = z.object({
  id: z.string({ message: "Only text is allowed" }),
});

export const AcceptFriendRequestSchema = z.object({
  id: z.string({ message: "Only text is allowed" }),
});

export const DeclineFriendRequestSchema = z.object({
  id: z.string({ message: "Only text is allowed" }),
});

export const GetFriendSchema = z.object({
  id: z.string({ message: "Only text is allowed" }),
});

export const GetDirectMessagesSchema = z.object({
  id: z.string({ message: "Only text is allowed" }),
});
