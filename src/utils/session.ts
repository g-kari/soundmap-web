import type { Env } from "../../load-context";
import {
  setCookie as tanstackSetCookie,
  getCookie as tanstackGetCookie,
  deleteCookie as tanstackDeleteCookie,
} from "@tanstack/react-start/server";

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
export async function getSessionFromKV(
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
export async function deleteSessionFromKV(
  kv: KVNamespace,
  sessionToken: string
): Promise<void> {
  await kv.delete(sessionToken);
}

// Set session cookie using TanStack Start API
export function setSessionCookie(sessionToken: string): void {
  tanstackSetCookie(SESSION_COOKIE_NAME, sessionToken, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_SECONDS,
  });
}

// Get session token from cookie using TanStack Start API
export function getSessionCookie(): string | undefined {
  return tanstackGetCookie(SESSION_COOKIE_NAME);
}

// Clear session cookie using TanStack Start API
export function clearSessionCookie(): void {
  tanstackDeleteCookie(SESSION_COOKIE_NAME, {
    path: "/",
  });
}

// Get session from current request
export async function getCurrentSession(
  kv: KVNamespace
): Promise<SessionData | null> {
  const sessionToken = getSessionCookie();
  if (!sessionToken) return null;
  return getSessionFromKV(kv, sessionToken);
}

// Create session and set cookie
export async function createAndSetSession(
  kv: KVNamespace,
  data: SessionData
): Promise<string> {
  const sessionToken = await createSession(kv, data);
  setSessionCookie(sessionToken);
  return sessionToken;
}

// Delete session and clear cookie
export async function deleteCurrentSession(kv: KVNamespace): Promise<void> {
  const sessionToken = getSessionCookie();
  if (sessionToken) {
    await deleteSessionFromKV(kv, sessionToken);
  }
  clearSessionCookie();
}
