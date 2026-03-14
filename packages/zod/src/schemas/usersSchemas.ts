import z from "zod";

export const updateStatusSchema = z.object({
  userId: z.string(),
  status: z.enum(["ONLINE", "OFFLINE"]),
});

export const UpdateAvatarConfigSchema = z.object({
  avatarConfig: z.string().nullable(),
});
