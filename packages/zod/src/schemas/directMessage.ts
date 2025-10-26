import z from "zod";

export const createDirectMessageSchema = z.object({
  content: z
    .string({
      message: "Only text is allowed",
    })
    .min(1, {
      message: "This field is required",
    }),

  senderId: z
    .string({
      message: "Only text is allowed",
    })
    .min(1, {
      message: "This field is required",
    }),

  recieverId: z
    .string({
      message: "Only text is allowed",
    })
    .min(1, {
      message: "This field is required",
    }),
});
