import type { NextConfig } from "next";
const nextConfig:NextConfig={
  devIndicators:false,
  ...(process.env.NEXT_OUTPUT_STANDALONE==="true" ? {output:"standalone" as const} : {}),
};
export default nextConfig;
