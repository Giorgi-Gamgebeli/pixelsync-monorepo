import type { DirectMessage, GroupMessage, UserStatus } from "@repo/types";

type DMChatPageData = {
  messages: DirectMessage[];
};

type GroupChatPageData = {
  group: {
    id: number;
    name: string;
    ownerId: string;
    members: {
      id: string;
      userName: string | null;
      avatarConfig: string | null;
      status: UserStatus;
    }[];
  };
  currentUserAvatarConfig: string | null;
  messages: GroupMessage[];
};

type DMChatQueryKey = readonly ["dm-chat", string];
type GroupChatQueryKey = readonly ["group-chat", string];

export type {
  DMChatPageData,
  GroupChatPageData,
  DMChatQueryKey,
  GroupChatQueryKey,
};
