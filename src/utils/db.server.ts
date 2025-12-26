import type { Env } from "../../load-context";

// Cloudflare Workers の env 関数を動的にインポート
// cloudflare:workers モジュールはサーバーサイドのみで利用可能
let cloudflareEnvFn: (() => Env) | null = null;

// サーバー起動時に cloudflare:workers から env を取得
async function initCloudflareEnv() {
  if (cloudflareEnvFn === null) {
    try {
      // @ts-ignore - cloudflare:workers はCloudflare Workers ランタイムでのみ利用可能
      const cloudflareWorkers = await import("cloudflare:workers");
      cloudflareEnvFn = cloudflareWorkers.env;
    } catch {
      // 開発環境や非Cloudflare環境ではインポートに失敗する
      cloudflareEnvFn = undefined as any;
    }
  }
  return cloudflareEnvFn;
}

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

  // パターン5: cloudflare:workers からの env 関数（同期呼び出しのため初期化済みの場合のみ）
  if (typeof cloudflareEnvFn === "function") {
    return cloudflareEnvFn();
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

  // cloudflare:workers から取得を試みる
  const envFn = await initCloudflareEnv();
  if (typeof envFn === "function") {
    cloudflareEnvFn = envFn; // キャッシュ
    return envFn();
  }

  return envFromContext;
}

// Get DB from cloudflare context
export function getDB(env: { DATABASE: D1Database }) {
  return env.DATABASE;
}
