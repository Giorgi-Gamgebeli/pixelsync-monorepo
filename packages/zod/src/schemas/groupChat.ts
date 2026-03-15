import { z } from "zod";

export const CreateGroupChatSchema = z.object({
  name: z
    .string({ message: "Only text is allowed" })
    .min(1, { message: "Group name is required" })
    .max(50, { message: "Group name must be at most 50 characters" }),
  memberIds: z
    .array(z.string())
    .min(1, { message: "At least one member is required" }),
});

export const GroupIdSchema = z.object({
  groupId: z.number().int().positive(),
});
