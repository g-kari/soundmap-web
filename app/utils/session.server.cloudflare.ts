import { createCookieSessionStorage, redirect } from "@remix-run/cloudflare";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { getDB, generateId } from "./db.server.cloudflare";

const sessionSecret = "soundmap-secret-key-change-in-production";

const storage = createCookieSessionStorage({
  cookie: {
    name: "soundmap_session",
    secure: true,
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export async function createUserSession(
  userId: string,
  redirectTo: string,
  context: AppLoadContext
) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(
  request: Request,
  context: AppLoadContext,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request, context: AppLoadContext) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const db = getDB(context);
    const result = await db
      .prepare(
        "SELECT id, email, username, avatar_url as avatarUrl, bio FROM users WHERE id = ?"
      )
      .bind(userId)
      .first();

    return result;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}
