import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 17449, host: true },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
