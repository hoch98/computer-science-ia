import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Webpack to leave these native packages alone
  serverExternalPackages: [
    "@libsql/client", 
    "@prisma/adapter-libsql", 
    "libsql"
  ],
  
  // ... any other config you already have (like images, etc.)
};

export default nextConfig;