import type { NextConfig } from "next";
import path from "node:path";
import dotenv from "dotenv";
import { withSentryConfig } from "@sentry/nextjs";

// Load environment variables from the monorepo root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pgqopytnbkjovvnwtvun.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/pixelsync-bucket/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload logs when no auth token is set
  silent: !process.env.SENTRY_AUTH_TOKEN,
  // Skip source map upload in local dev / CI
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
