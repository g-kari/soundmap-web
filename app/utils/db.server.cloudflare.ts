import type { AppLoadContext } from "@remix-run/cloudflare";

export function getDB(context: AppLoadContext) {
  return context.cloudflare.env.DATABASE;
}

// Helper function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper function to get current timestamp
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
