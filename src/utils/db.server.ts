import type { Env } from "../../load-context";

// Helper function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper function to get current timestamp
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// Get Cloudflare environment from context
export function getEnv(context: any): Env {
  // デバッグ：コンテキストの構造を確認
  console.log("Context keys:", Object.keys(context || {}));
  console.log("Context.cloudflare:", context?.cloudflare);
  console.log("Context:", context);
  
  // コンテキストからCloudflare環境を取得
  // 開発環境とプロダクション環境で構造が異なる可能性があるため、両方に対応
  return (context as any).cloudflare?.env || (context as any);
}

// Get DB from cloudflare context
export function getDB(env: { DATABASE: D1Database }) {
  return env.DATABASE;
}
