import { DefaultSession } from "next-auth";
import { SessionPayloadSchema } from "@repo/zod";
import { z } from "zod";
 
export type ExtendedUser = DefaultSession["user"] & z.infer<typeof SessionPayloadSchema>;
 
declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }

  // interface JWT {
  //   avatar?: string;
  //   userName: string;
  //   sub: string;
  // }
}
