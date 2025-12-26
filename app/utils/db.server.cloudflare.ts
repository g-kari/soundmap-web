import type { AppLoadContext } from "@remix-run/cloudflare";

/**
 * Retrieve the Cloudflare `DATABASE` environment binding from the provided Remix load context.
 *
 * @param context - The Remix AppLoadContext that contains Cloudflare environment bindings
 * @returns The `DATABASE` binding from `context.cloudflare.env`
 */
export function getDB(context: AppLoadContext) {
  return context.cloudflare.env.DATABASE;
}

/**
 * Generates a UUID string.
 *
 * @returns A UUID string.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get the current Unix timestamp in seconds.
 *
 * @returns The current Unix timestamp in seconds (number of whole seconds since 1970-01-01T00:00:00Z)
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}