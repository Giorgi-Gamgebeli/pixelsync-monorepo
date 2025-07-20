import NextAuth, { NextAuthResult } from "next-auth";
import authConfig from "./auth.config";
import { db } from "@/app/_dataAcessLayer/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { generateUsername } from "./app/_utils/helpers";

const nexAuth = NextAuth({
  events: {
    async linkAccount({ user }) {
      const userName = generateUsername();

      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          userName,
          name: userName,
        },
      });
    },
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;
      if (!user.email) return false;

      const existingUser = await db.user.findUnique({
        where: {
          email: user.email,
        },
        select: {
          emailVerified: true,
        },
      });

      if (!existingUser?.emailVerified) return false;

      return true;
    },

    async jwt({ token }) {
      if (!token.email) return token;

      const existingUser = await db.user.findUnique({
        where: {
          email: token.email,
        },
        select: {
          id: true,
          image: true,
          name: true,
          userName: true,
        },
      });

      if (!existingUser) return token;

      return {
        sub: existingUser.id,
        image: existingUser.image,
        name: existingUser.name,
        userName: existingUser.userName,
        email: token.email,
        iat: token.iat,
        exp: token.exp,
        jti: token.jti,
      };
    },

    async session({ token, session }) {
      if (token.sub && session.user) session.user.id = token.sub;
      // console.log("sessia", session, token);

      if (session.user) {
        session.user.image = token.image as string;
        session.user.userName = token.userName as string;
        session.user.name = token.name as string;
      }

      return session;
    },
  },
  adapter: PrismaAdapter(db),
  ...authConfig,
});

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
} = nexAuth;
export const auth: NextAuthResult["auth"] = nexAuth.auth;
