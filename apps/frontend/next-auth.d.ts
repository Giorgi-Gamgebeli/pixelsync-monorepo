import { TokenPayloadSchema, UserPayloadSchema } from "@repo/zod";
import "next-auth";
import "next-auth/jwt";
import { z } from "zod";

declare module "next-auth" {
  interface Session {
    user: z.infer<typeof UserPayloadSchema>;
  }
}

declare module "next-auth/jwt" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface JWT extends z.infer<typeof TokenPayloadSchema> {}
}
