import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { prisma } from "./db.server";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "soundmap_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

/**
 * Create a session for the given user and redirect the client to the specified path.
 *
 * @param userId - The user's id to store in the session
 * @param redirectTo - The path to redirect the client to after creating the session
 * @returns A Response that redirects to `redirectTo` and includes a `Set-Cookie` header committing the session
 */
export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

/**
 * Retrieves the session from the request's Cookie header.
 *
 * @param request - The incoming Request whose "Cookie" header will be used to load the session
 * @returns The session associated with the request
 */
export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

/**
 * Retrieve the current user's id from the session.
 *
 * @returns The user's id string if present in the session, `null` otherwise.
 */
export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

/**
 * Ensures the current request is associated with an authenticated user and returns that user's id.
 *
 * @param redirectTo - The path to redirect back to after a successful login; used as the `redirectTo` query parameter when redirecting to the login page.
 * @returns The authenticated user's id.
 * @throws Redirects the request to `/login?redirectTo=...` when there is no valid `userId` in the session.
 */
export async function requireUserId(
  request: Request,
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
 * Fetches the current authenticated user's record from the database using the session userId.
 *
 * @returns The user object containing `id`, `email`, `username`, `avatarUrl`, and `bio`, or `null` if there is no authenticated user.
 * @throws A redirect response that clears the session if the database lookup fails.
 */
export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, avatarUrl: true, bio: true },
    });
    return user;
  } catch {
    throw logout(request);
  }
}

/**
 * Ends the current user session and redirects the client to the site root.
 *
 * @returns A redirect response to "/" with a `Set-Cookie` header that destroys the session cookie.
 */
export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}