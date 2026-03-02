import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      extensionAlias: {
        ".js": [".ts", ".js"],
      },
    };
    return config;
  },
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
