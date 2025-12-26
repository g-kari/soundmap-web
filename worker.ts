import { createRequestHandler, type ServerBuild } from "@remix-run/cloudflare";
// @ts-expect-error - build output is generated at build time
import * as build from "./build/server/index.js";

const requestHandler = createRequestHandler(build as unknown as ServerBuild);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      const loadContext = {
        cloudflare: {
          env,
          ctx,
          caches,
          cf: request.cf,
        },
      };
      return await requestHandler(request, loadContext);
    } catch (error) {
      console.error(error);
      return new Response("Internal Error", { status: 500 });
    }
  },
};

interface Env {
  DATABASE: D1Database;
  SESSION_KV: KVNamespace;
  AUDIO_BUCKET: R2Bucket;
}
