import type { DirectMessage, GroupMessage, UserStatus } from "@repo/types";
import type { Session } from "next-auth";

type DMChatPageData = {
  session: Session;
  friend: {
    id: string;
    userName: string | null;
    status: UserStatus;
    avatarConfig: string | null;
  };
  currentUserAvatarConfig: string | null;
  messages: DirectMessage[];
};

type GroupChatPageData = {
  session: Session;
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
