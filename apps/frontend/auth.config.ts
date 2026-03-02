// import type { NextAuthConfig } from "next-auth";
// import { compare } from "bcryptjs";
// import Credentials from "next-auth/providers/credentials";
// import { SigninSchema } from "@repo/zod";
// import { db } from "@repo/db";
// import Github from "next-auth/providers/github";
// import Google from "next-auth/providers/google";

// export default {
//   session: {
//     maxAge: 2 * 24 * 60 * 60, // inactive for 2 days = logout
//     strategy: "jwt",
//   },
//   providers: [
//     Google({
//       clientId: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     }),
//     Github({
//       clientId: process.env.GITHUB_CLIENT_ID,
//       clientSecret: process.env.GITHUB_CLIENT_SECRET,
//     }),
//     Credentials({
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials.password) return null;

//         const result = SigninSchema.safeParse(credentials);

//         if (!result.success) return null;

//         const { email, password } = result.data;

//         const user = await db.user.findUnique({
//           where: {
//             email,
//           },
//           select: {
//             password: true,
//             email: true,
//             id: true,
//             userName: true,
//           },
//         });

//         if (!user || !user.password) return null;

//         const isPasswordValid = await compare(
//           password as string,
//           user.password as string,
//         );

//         if (!isPasswordValid) return null;

//         return {
//           email: user.email,
//         };
//       },
//     }),
//   ],
//   pages: {
//     signIn: "/auth/signin",
//     error: "/auth/signin",
//   },
// } satisfies NextAuthConfig;


import type { NextAuthConfig } from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// This config is used by the Edge middleware - it must NOT import
// any Node.js-only modules (like Prisma/pg). The Credentials provider
// with its db-dependent authorize() lives in auth.ts instead.
const authConfig: NextAuthConfig = {
  session: {
    maxAge: 2 * 24 * 60 * 60, // inactive for 2 days = logout
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
};

export default authConfig;
