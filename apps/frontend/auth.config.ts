import type { NextAuthConfig } from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// This configuration is shared between the Middleware (Edge) and the main Auth (Node.js).
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
