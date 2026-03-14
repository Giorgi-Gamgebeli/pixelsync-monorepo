import { DefaultSession } from "next-auth";
import { SessionPayloadSchema } from "@repo/zod";
import { z } from "zod";

export type ExtendedUser = DefaultSession["user"] & z.infer<typeof SessionPayloadSchema>;

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    image?: string | null;
    userName?: string;
    accessToken?: string;
  }
}
