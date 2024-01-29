import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
      crypto: "crypto-browserify",
    },
  },
  define: {
    global: {},
    "process.env": {},
    "process.browser": true,
  },
  plugins: [tsconfigPaths(), vue()],
});
