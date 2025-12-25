import { type PlatformProxy } from "wrangler";

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}

export interface Env {
  DATABASE: D1Database;
  SESSION_KV: KVNamespace;
  AUDIO_BUCKET: R2Bucket;
}
