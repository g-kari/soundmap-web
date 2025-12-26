// Helper function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper function to get current timestamp
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// Get DB from cloudflare context
export function getDB(env: { DATABASE: D1Database }) {
  return env.DATABASE;
}
