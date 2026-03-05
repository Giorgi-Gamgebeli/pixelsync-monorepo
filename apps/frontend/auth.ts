import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@repo/db";
import { SigninSchema } from "@repo/zod";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import NextAuth, { NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { generateUsername } from "./app/_utils/helpers";
import authConfig from "./auth.config";

const nexAuth = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const result = SigninSchema.safeParse(credentials);

        if (!result.success) return null;

        const { email, password } = result.data;

        const user = await db.user.findUnique({
          where: {
            email,
          },
          select: {
            password: true,
            email: true,
            id: true,
            userName: true,
          },
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await compare(
          password as string,
          user.password as string,
        );

        if (!isPasswordValid) return null;

        return {
          email: user.email,
        };
      },
    }),
  ],
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

      const accessToken = jwt.sign(
        { sub: token.sub }, // payload (only includes user id here)
        process.env.ACCESS_TOKEN_SECRET!, // secret key used to sign
        { expiresIn: "15m" }, // expires in 15 minutes
      );

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
        accessToken,
      };
    },
    async session({ token, session }) {
      if (token.sub && session.user) session.user.id = token.sub;

      if (session.user) {
        session.user.image = token.image as string;
        session.user.userName = token.userName as string;
        session.user.name = token.name as string;
        session.user.accessToken = token.accessToken as string;
      }

      return session;
    },
  },
  adapter: PrismaAdapter(db),
});

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
} = nexAuth;
export const auth: NextAuthResult["auth"] = nexAuth.auth;
