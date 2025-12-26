import type { Env } from "../../load-context";

// cloudflare:workers から env を直接インポート
// @ts-ignore - cloudflare:workers はCloudflare Workers ランタイムでのみ利用可能
import { env as cloudflareEnv } from "cloudflare:workers";

// Helper function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper function to get current timestamp
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// Get Cloudflare environment from context or cloudflare:workers
export function getEnv(context: any): Env {
  // コンテキストからCloudflare環境を取得
  // 開発環境とプロダクション環境で構造が異なる可能性があるため、複数のパターンに対応

  // パターン1: context.cloudflare.env (TanStack Start + Cloudflare Vite Plugin)
  if (context?.cloudflare?.env) {
    return context.cloudflare.env;
  }

  // パターン2: context.env (直接環境が渡される場合)
  if (context?.env?.DATABASE) {
    return context.env;
  }

  // パターン3: context自体が環境オブジェクト
  if (context?.DATABASE) {
    return context;
  }

  // パターン4: context.cf (Cloudflare Workers の場合)
  if (context?.cf?.env) {
    return context.cf.env;
  }

  // パターン5: cloudflare:workers からの env オブジェクト
  if (cloudflareEnv?.DATABASE) {
    return cloudflareEnv as unknown as Env;
  }

  // デバッグ用: コンテキストのキーをログ出力
  const contextKeys = context ? Object.keys(context) : [];
  console.error("getEnv: Unable to find Cloudflare env. Context keys:", contextKeys);

  // フォールバック: 空のオブジェクトを返す（呼び出し側でチェックされる）
  return {} as Env;
}

// 非同期版の getEnv - cloudflare:workers からの取得を試みる
export async function getEnvAsync(context: any): Promise<Env> {
  // まずコンテキストからの取得を試みる
  const envFromContext = getEnv(context);
  if (envFromContext?.DATABASE) {
    return envFromContext;
  }

  // cloudflare:workers からの env オブジェクトを試みる
  if (cloudflareEnv?.DATABASE) {
    return cloudflareEnv as unknown as Env;
  }

  return envFromContext;
}

// Get DB from cloudflare context
export function getDB(env: { DATABASE: D1Database }) {
  return env.DATABASE;
}
