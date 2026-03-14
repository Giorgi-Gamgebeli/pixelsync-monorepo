import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@repo/db";
import { SigninSchema, TokenPayloadSchema, z } from "@repo/zod";
import { compare } from "bcryptjs";
import NextAuth, { NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { generateUsername } from "./app/_utils/helpers";
import authConfig from "./auth.config";

const nextAuth = NextAuth({
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

      if (!existingUser) return token;

      return {
        sub: existingUser.id,
        image: existingUser.image,
        name: existingUser.name,
        userName: existingUser.userName,
        email: token.email,
        exp: token.exp,

        iat: token.iat,
        jti: token.jti,
      } satisfies z.infer<typeof TokenPayloadSchema>;
    },
    async session({ token, session }) {
      if (token.sub && session.user) session.user.id = token.sub;

      if (session.user) {
        session.user.name = token.name;
        session.user.exp = token.exp;
        session.user.image = token.image;
        session.user.userName = token.userName;
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
} = nextAuth;
export const auth: NextAuthResult["auth"] = nextAuth.auth;
