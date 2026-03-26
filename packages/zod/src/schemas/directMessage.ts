import { z } from "zod";

export const createDirectMessageSchema = z.object({
  id: z.string().min(1),

  content: z
    .string({
      message: "Only text is allowed",
    })
    .min(1, {
      message: "This field is required",
    })
    .max(4000, {
      message: "Message is too long",
    }),

  senderId: z
    .string({
      message: "Only text is allowed",
    })
    .min(1, {
      message: "This field is required",
    }),

  receiverId: z
    .string({
      message: "Only text is allowed",
    })
    .min(1, {
      message: "This field is required",
    }),
});
