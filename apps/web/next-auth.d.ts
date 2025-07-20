import { DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  avatar?: string;
  userName: string;
  id: string;
};

declare module "next-auth" {
  // interface User {
  //   avatar?: string;
  //   userName: string;
  //   numID: number;
  // }

  interface Session {
    user: ExtendedUser;
  }

  // interface JWT {
  //   avatar?: string;
  //   userName: string;
  //   sub: string;
  // }
}
