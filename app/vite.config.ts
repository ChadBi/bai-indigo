import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  base: "./",
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
