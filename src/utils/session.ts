import type { Env } from "../../load-context";

const SESSION_COOKIE_NAME = "session_id";
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionData {
  userId: string;
  username: string;
  email: string;
}

// Generate a secure random session token
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

// Create a new session and store in KV
export async function createSession(
  kv: KVNamespace,
  data: SessionData
): Promise<string> {
  const sessionToken = generateSessionToken();
  await kv.put(sessionToken, JSON.stringify(data), {
    expirationTtl: SESSION_EXPIRY_SECONDS,
  });
  return sessionToken;
}

// Get session data from KV
export async function getSession(
  kv: KVNamespace,
  sessionToken: string
): Promise<SessionData | null> {
  const data = await kv.get(sessionToken);
  if (!data) return null;
  try {
    return JSON.parse(data) as SessionData;
  } catch {
    return null;
  }
}

// Delete session from KV
export async function deleteSession(
  kv: KVNamespace,
  sessionToken: string
): Promise<void> {
  await kv.delete(sessionToken);
}

// Parse session token from cookie header
export function getSessionTokenFromCookie(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === SESSION_COOKIE_NAME && value) {
      return value;
    }
  }
  return null;
}

// Create Set-Cookie header for session
export function createSessionCookie(sessionToken: string): string {
  return `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_EXPIRY_SECONDS}`;
}

// Create Set-Cookie header for logout (expire the cookie)
export function createLogoutCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Get session from request context
export async function getSessionFromRequest(
  env: Env,
  request: Request
): Promise<SessionData | null> {
  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = getSessionTokenFromCookie(cookieHeader);
  if (!sessionToken) return null;
  return getSession(env.SESSION_KV, sessionToken);
}

// Require authenticated session (throws if not authenticated)
export async function requireSession(
  env: Env,
  request: Request
): Promise<SessionData> {
  const session = await getSessionFromRequest(env, request);
  if (!session) {
    throw new Error("認証が必要です");
  }
  return session;
}
