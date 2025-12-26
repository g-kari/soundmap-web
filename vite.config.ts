import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      configFromWorkerOptions: {
        d1Databases: [
          {
            binding: "DATABASE",
            database_name: "soundmap-db",
            database_id: "03d5131e-beb3-4142-9f44-4e430921836f",
          },
        ],
        kvNamespaces: [
          {
            binding: "SESSION_KV",
            id: "2e73e7ed1d464b9f82859dd3421a1e80",
          },
        ],
        r2Buckets: [
          {
            binding: "AUDIO_BUCKET",
            bucket_name: "soundmap-audio",
          },
        ],
      },
    }),
    tanstackStart(),
    react(),
    tsconfigPaths(),
  ],
});
