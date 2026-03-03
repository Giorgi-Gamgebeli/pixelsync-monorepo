import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from the monorepo root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
        port: "",
        pathname: "/api/portraits/**",
      },
      {
        protocol: "https",
        hostname: "pgqopytnbkjovvnwtvun.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/pixelsync-bucket/**",
      },
    ],
  },
};

export default nextConfig;
