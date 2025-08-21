import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS:
      process.env.NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS || "",
    NEXT_PUBLIC_TRADERJOE_ROUTER_ADDRESS:
      process.env.NEXT_PUBLIC_TRADERJOE_ROUTER_ADDRESS || "",
    NEXT_PUBLIC_AAVE_POOL_ADDRESS:
      process.env.NEXT_PUBLIC_AAVE_POOL_ADDRESS || "",
    NEXT_PUBLIC_YIELDYAK_FARM_ADDRESS:
      process.env.NEXT_PUBLIC_YIELDYAK_FARM_ADDRESS || "",
    NEXT_PUBLIC_WC_PROJECT_ID: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "",
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || "31337",
    NEXT_PUBLIC_RPC_URL:
      process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
  },
};

export default nextConfig;
