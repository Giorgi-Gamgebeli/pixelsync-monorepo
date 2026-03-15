import z from "zod";

export const updateStatusSchema = z.object({
  userId: z.string(),
  status: z.enum(["ONLINE", "OFFLINE", "IDLE", "DO_NOT_DISTURB"]),
});

export const UpdateAvatarConfigSchema = z.object({
  avatarConfig: z.string().nullable(),
});

export const UpdateUserNameSchema = z.object({
  userName: z
    .string({ message: "Only text is allowed" })
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be at most 20 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Only letters, numbers, and underscores",
    }),
});

export const UnfriendSchema = z.object({
  id: z.string({ message: "Only text is allowed" }),
});
