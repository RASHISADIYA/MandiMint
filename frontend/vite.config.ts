import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const localHardhatRpcUrl =
  process.env.LOCAL_HARDHAT_RPC_URL || "http://127.0.0.1:8545";

export default defineConfig({
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
});
