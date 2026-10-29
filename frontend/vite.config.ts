import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const localHardhatRpcUrl =
    env.LOCAL_HARDHAT_RPC_URL || "http://127.0.0.1:8545";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/hardhat-rpc": {
          target: localHardhatRpcUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/hardhat-rpc/, ""),
        },
      },
    },
  };
});
