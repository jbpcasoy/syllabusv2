import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()], // resolves the "@/..." alias from tsconfig.json
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
