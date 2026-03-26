import { z } from "zod";

export const groupSendSchema = z.object({
  id: z.string().min(1),
  groupId: z.number().int().positive(),
  content: z
    .string()
    .min(1)
    .max(4000)
    .refine((s) => s.trim().length > 0),
});

export const groupTypingSchema = z.object({
  groupId: z.number().int().positive(),
  isTyping: z.boolean(),
});

export const groupJoinSchema = z.object({
  groupId: z.number().int().positive(),
});

export const callInitiateSchema = z.object({
  receiverId: z.string().min(1),
  callType: z.enum(["audio", "video"]),
});

export const callIdSchema = z.object({
  callId: z.string().uuid(),
});

export const callOfferSchema = z.object({
  callId: z.string().uuid(),
  toUserId: z.string().min(1),
  offer: z.object({
    type: z.string(),
    sdp: z.string().optional(),
  }),
});

export const callAnswerSchema = z.object({
  callId: z.string().uuid(),
  toUserId: z.string().min(1),
  answer: z.object({
    type: z.string(),
    sdp: z.string().optional(),
  }),
});

export const callIceCandidateSchema = z.object({
  callId: z.string().uuid(),
  toUserId: z.string().min(1),
  candidate: z.object({
    candidate: z.string().optional(),
    sdpMid: z.string().nullable().optional(),
    sdpMLineIndex: z.number().nullable().optional(),
  }),
});

export const callMediaStateSchema = z.object({
  callId: z.string().uuid(),
  audioEnabled: z.boolean(),
  videoEnabled: z.boolean(),
});

export const callGroupJoinSchema = z.object({
  groupId: z.number().int().positive(),
  callType: z.enum(["audio", "video"]),
});

export const dmReadSchema = z.object({
  senderId: z.string().min(1),
});

export const dmTypingSchema = z.object({
  receiverId: z.string().min(1),
  isTyping: z.boolean(),
});

export const profileUpdateSchema = z.object({
  userName: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  avatarConfig: z.string().nullable().optional(),
});
