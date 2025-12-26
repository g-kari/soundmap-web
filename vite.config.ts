import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart(),
    cloudflare({
      persistState: true,
      configPath: "./wrangler.jsonc",
    }),
    react(),
    tsconfigPaths(),
  ],
});
