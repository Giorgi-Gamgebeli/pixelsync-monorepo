import { z } from "zod";

// Enums
export const UserStatusEnum = z.enum([
  "ONLINE",
  "IDLE",
  "DO_NOT_DISTURB",
  "OFFLINE",
]);
export const ThemeEnum = z.enum(["LIGHT", "DARK", "SYSTEM"]);
export const ChannelTypeEnum = z.enum(["TEXT", "VOICE"]);
export const RequestStatusEnum = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);

// User Schema
export const UserSchemaDatabase = z.object({
  id: z.number().int().positive(),

  email: z
    .string({
      message: "Only text is allowed",
    })
    .min(1, {
      message: "This field is required",
    })
    .email({
      message: "Please provide a valid email address",
    })
    .regex(/\S+@\S+\.\S+/, {
      message: "Please provide a valid email address",
    }),

  password: z
    .string({
      message: "Password is required",
    })
    .min(1, {
      message: "This field is required",
    }),

  userName: z
    .string({
      message: "Only text is allowed",
    })
    .min(1, {
      message: "This field is required",
    }),

  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),

  status: UserStatusEnum.default("OFFLINE"),
  statusMessage: z.string().nullable().optional(),

  lastSeen: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
});

// UserSettings Schema
export const UserSettingsSchemaDatabase = z.object({
  id: z.number().int().positive(),

  theme: ThemeEnum.default("LIGHT"),

  notifications: z
    .boolean({
      message: "Must be a boolean value",
    })
    .default(true),

  soundEnabled: z
    .boolean({
      message: "Must be a boolean value",
    })
    .default(true),

  userId: z.number().int().positive(),
});

// DirectMessage Schema
export const DirectMessageSchemaDatabase = z.object({
  id: z.number().int().positive(),

  content: z
    .string({
      message: "Message content is required",
    })
    .min(1, {
      message: "Message cannot be empty",
    }),

  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),

  isRead: z
    .boolean({
      message: "Must be a boolean value",
    })
    .default(false),

  senderId: z.number().int().positive(),
  receiverId: z.number().int().positive(),
});

// Channel Schema
export const ChannelSchemaDatabase = z.object({
  id: z.number().int().positive(),

  name: z
    .string({
      message: "Only text is allowed",
    })
    .min(1, {
      message: "Channel name is required",
    }),

  description: z.string().nullable().optional(),

  type: ChannelTypeEnum.default("TEXT"),

  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),

  workspaceId: z.number().int().positive(),
});

// ChannelMessage Schema
export const ChannelMessageSchemaDatabase = z.object({
  id: z.number().int().positive(),

  content: z
    .string({
      message: "Message content is required",
    })
    .min(1, {
      message: "Message cannot be empty",
    }),

  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),

  isEdited: z
    .boolean({
      message: "Must be a boolean value",
    })
    .default(false),

  channelId: z.number().int().positive(),
  senderId: z.number().int().positive(),
});

// FriendRequest Schema
export const FriendRequestSchemaDatabase = z.object({
  id: z.number().int().positive(),

  createdAt: z.date().default(() => new Date()),

  status: RequestStatusEnum.default("PENDING"),

  senderId: z.number().int().positive(),
  receiverId: z.number().int().positive(),
});

// Workspace Schema
export const WorkspaceSchemaDatabase = z.object({
  id: z.number().int().positive(),

  name: z
    .string({
      message: "Only text is allowed",
    })
    .min(1, {
      message: "Workspace name is required",
    }),

  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),

  ownerId: z.number().int().positive(),
});

// Whiteboard Schema
export const WhiteboardSchemaDatabase = z.object({
  id: z.number().int().positive(),

  title: z
    .string({
      message: "Only text is allowed",
    })
    .min(1, {
      message: "Whiteboard title is required",
    }),

  content: z.instanceof(Buffer, {
    message: "Content must be binary data",
  }),

  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),

  workspaceId: z.number().int().positive(),
});

// Input validation schemas (for creating new records)
export const CreateUserInputSchema = UserSchemaDatabase.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSeen: true,
});

export const CreateUserSettingsInputSchema = UserSettingsSchemaDatabase.omit({
  id: true,
});

export const CreateDirectMessageInputSchema = DirectMessageSchemaDatabase.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isRead: true,
});

export const CreateChannelInputSchema = ChannelSchemaDatabase.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateChannelMessageInputSchema =
  ChannelMessageSchemaDatabase.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    isEdited: true,
  });

export const CreateFriendRequestInputSchema = FriendRequestSchemaDatabase.omit({
  id: true,
  createdAt: true,
  status: true,
});

export const CreateWorkspaceInputSchema = WorkspaceSchemaDatabase.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateWhiteboardInputSchema = WhiteboardSchemaDatabase.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
