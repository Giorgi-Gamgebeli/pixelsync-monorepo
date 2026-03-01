// import NextAuth, { NextAuthResult } from "next-auth";
// import authConfig from "./auth.config";
// import { db } from "@repo/db";
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { generateUsername } from "./app/_utils/helpers";
// import jwt from "jsonwebtoken";

// const nexAuth = NextAuth({
//   events: {
//     async linkAccount({ user }) {
//       const userName = generateUsername();

//       await db.user.update({
//         where: { id: user.id },
//         data: {
//           emailVerified: new Date(),
//           userName,
//           name: userName,
//         },
//       });
//     },
//   },

//   callbacks: {
//     async signIn({ user, account }) {
//       if (account?.provider !== "credentials") return true;
//       if (!user.email) return false;

//       const existingUser = await db.user.findUnique({
//         where: {
//           email: user.email,
//         },
//         select: {
//           emailVerified: true,
//         },
//       });

//       if (!existingUser?.emailVerified) return false;

//       return true;
//     },

//     async jwt({ token, user, account }) {
//       if (!token.email) return token;
//       console.log(token, user, account, "reroooooooooool");

//       const existingUser = await db.user.findUnique({
//         where: {
//           email: token.email,
//         },
//         select: {
//           id: true,
//           image: true,
//           name: true,
//           userName: true,
//         },
//       });

//       const accessToken = jwt.sign(
//         { sub: token.sub }, // payload (only includes user id here)
//         process.env.ACCESS_TOKEN_SECRET!, // secret key used to sign
//         { expiresIn: "15m" }, // expires in 15 minutes
//       );

//       if (!existingUser) return token;

//       return {
//         sub: existingUser.id,
//         image: existingUser.image,
//         name: existingUser.name,
//         userName: existingUser.userName,
//         email: token.email,
//         iat: token.iat,
//         exp: token.exp,
//         jti: token.jti,
//         accessToken,
//       };
//     },

//     async session({ token, session }) {
//       if (token.sub && session.user) session.user.id = token.sub;
//       // console.log("sessia", session, token);

//       if (session.user) {
//         session.user.image = token.image as string;
//         session.user.userName = token.userName as string;
//         session.user.name = token.name as string;
//         session.user.accessToken = token.accessToken as string;
//       }

//       return session;
//     },
//   },
//   adapter: PrismaAdapter(db),
//   ...authConfig,
// });

// export const {
//   handlers: { GET, POST },
//   signIn,
//   signOut,
// } = nexAuth;
// export const auth: NextAuthResult["auth"] = nexAuth.auth;




// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { db } from "@repo/db";
// import { SignJWT } from "jose";
// import NextAuth, { NextAuthResult } from "next-auth";
// import { cookies } from "next/headers";
// import { generateUsername } from "./app/_utils/helpers";
// import authConfig from "./auth.config";

// const nexAuth = NextAuth({
//   events: {
//     async linkAccount({ user }) {
//       const userName = generateUsername();

//       await db.user.update({
//         where: { id: user.id },
//         data: {
//           emailVerified: new Date(),
//           userName,
//           name: userName,
//         },
//       });
//     },
//     async signIn({ user }) {
//       if (!user.id || !user.email) return;

//       const accessTokenSecret = new TextEncoder().encode(
//         process.env.ACCESS_TOKEN_SECRET!,
//       );
//       const refreshTokenSecret = new TextEncoder().encode(
//         process.env.REFRESH_TOKEN_SECRET!,
//       );

//       const accessToken = await new SignJWT({ sub: user.id, email: user.email })
//         .setProtectedHeader({ alg: "HS256" })
//         .setIssuedAt()
//         .setExpirationTime("1d")
//         .sign(accessTokenSecret);

//       const refreshToken = await new SignJWT({ sub: user.id })
//         .setProtectedHeader({ alg: "HS256" })
//         .setIssuedAt()
//         .setExpirationTime("7d")
//         .sign(refreshTokenSecret);

//       // Save refresh token to database
//       await db.refreshToken.create({
//         data: {
//           token: refreshToken,
//           userId: user.id,
//           expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//         },
//       });

//       const cookieStore = await cookies();

//       cookieStore.set("accessToken", accessToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "lax",
//         maxAge: 1 * 24 * 60 * 60, // 1 day
//         path: "/",
//       });

//       cookieStore.set("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "lax",
//         maxAge: 7 * 24 * 60 * 60, // 7 days
//         path: "/",
//       });
//     },
//   },

//   callbacks: {
//     async signIn({ user, account }) {
//       if (account?.provider !== "credentials") return true;
//       if (!user.email) return false;

//       const existingUser = await db.user.findUnique({
//         where: {
//           email: user.email,
//         },
//         select: {
//           emailVerified: true,
//         },
//       });

//       if (!existingUser?.emailVerified) return false;

//       return true;
//     },

//     async jwt({ token, user, account }) {
//       if (!token.email) return token;
//       // console.log(token, user, account, "reroooooooooool");

//       const existingUser = await db.user.findUnique({
//         where: {
//           email: token.email,
//         },
//         select: {
//           id: true,
//           image: true,
//           name: true,
//           userName: true,
//         },
//       });

//       const accessTokenSecret = new TextEncoder().encode(
//         process.env.ACCESS_TOKEN_SECRET!,
//       );

//       const accessToken = await new SignJWT({ sub: token.sub })
//         .setProtectedHeader({ alg: "HS256" })
//         .setIssuedAt()
//         .setExpirationTime("15m")
//         .sign(accessTokenSecret);

//       if (!existingUser) return token;

//       return {
//         sub: existingUser.id,
//         image: existingUser.image,
//         name: existingUser.name,
//         userName: existingUser.userName,
//         email: token.email,
//         iat: token.iat,
//         exp: token.exp,
//         jti: token.jti,
//         accessToken,
//       };
//     },

//     async session({ token, session }) {
//       if (token.sub && session.user) session.user.id = token.sub;

//       if (session.user) {
//         session.user.image = token.image as string;
//         session.user.userName = token.userName as string;
//         session.user.name = token.name as string;
//         session.user.accessToken = token.accessToken as string;
//       }

//       return session;
//     },
//   },
//   adapter: PrismaAdapter(db),
//   ...authConfig,
// });

// export const {
//   handlers: { GET, POST },
//   signIn,
//   signOut,
// } = nexAuth;
// export const auth: NextAuthResult["auth"] = nexAuth.auth;



import NextAuth, { NextAuthResult } from "next-auth";
import authConfig from "./auth.config";
import { db } from "@repo/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { generateUsername } from "./app/_utils/helpers";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { SigninSchema } from "@repo/zod";

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
          id: user.id,
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
    async signIn({ user }) {
      if (!user.id || !user.email) return;

      const accessTokenSecret = new TextEncoder().encode(
        process.env.ACCESS_TOKEN_SECRET!,
      );
      const refreshTokenSecret = new TextEncoder().encode(
        process.env.REFRESH_TOKEN_SECRET!,
      );

      const accessToken = await new SignJWT({ sub: user.id, email: user.email })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(accessTokenSecret);

      const refreshToken = await new SignJWT({ sub: user.id })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(refreshTokenSecret);

      // Save refresh token to database
      await db.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const cookieStore = await cookies();

      cookieStore.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1 * 24 * 60 * 60, // 1 day
        path: "/",
      });

      cookieStore.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
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

    async jwt({ token, user, account }) {
      if (!token.email) return token;
      // console.log(token, user, account, "reroooooooooool");

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

      const accessTokenSecret = new TextEncoder().encode(
        process.env.ACCESS_TOKEN_SECRET!,
      );

      const accessToken = await new SignJWT({ sub: token.sub })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(accessTokenSecret);

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
