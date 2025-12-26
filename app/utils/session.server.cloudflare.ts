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

/**
 * Creates a session containing the provided user id and issues a redirect to the specified URL.
 *
 * @param userId - The id to store in the session under the `userId` key
 * @param redirectTo - The URL to redirect the client to after the session is created
 * @returns A Response that redirects to `redirectTo` with a `Set-Cookie` header committing a session containing `userId`
 */
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

/**
 * Retrieve the session associated with the incoming request's cookies.
 *
 * @returns The session extracted from the request cookies
 */
export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

/**
 * Retrieve the current user's ID from the session.
 *
 * @returns The user ID string if present in the session, or `null` otherwise.
 */
export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

/**
 * Ensures the request is authenticated and returns the current user's ID.
 *
 * @param request - The incoming HTTP request to inspect for a session
 * @param redirectTo - Path to return to after successful login; defaults to the current request pathname
 * @returns The authenticated user's ID
 * @throws Throws a redirect to `/login?redirectTo=...` when no valid user ID is present in the session
 */
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

/**
 * Fetches the currently authenticated user's record from the database.
 *
 * @param request - The incoming Request whose session is used to determine the user ID.
 * @param context - The app load context used to obtain a database connection.
 * @returns The user object with properties `id`, `email`, `username`, `avatarUrl`, and `bio`, or `null` if there is no authenticated user.
 * @throws Throws the value returned by `logout(request)` to clear the session and redirect if a database error occurs.
 */
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

/**
 * Clears the current user's session and redirects to the site's root path.
 *
 * @returns A Response that redirects to `/` and includes a `Set-Cookie` header which destroys the session.
 */
export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}