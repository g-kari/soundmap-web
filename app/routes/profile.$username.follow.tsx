import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { getDB, generateId } from "~/utils/db.server.cloudflare";
import { requireUserId } from "~/utils/session.server.cloudflare";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const userId = await requireUserId(request, context);
  const { username } = params;

  if (!username) {
    throw new Response("Not Found", { status: 404 });
  }

  const db = getDB(context);

  const targetUser = await db
    .prepare("SELECT id FROM users WHERE username = ?")
    .bind(username)
    .first<{ id: string }>();

  if (!targetUser) {
    throw new Response("Not Found", { status: 404 });
  }

  if (targetUser.id === userId) {
    throw new Response("Cannot follow yourself", { status: 400 });
  }

  const existingFollow = await db
    .prepare("SELECT id FROM follows WHERE follower_id = ? AND following_id = ?")
    .bind(userId, targetUser.id)
    .first();

  if (existingFollow) {
    await db
      .prepare("DELETE FROM follows WHERE id = ?")
      .bind(existingFollow.id)
      .run();
  } else {
    const followId = generateId();
    const timestamp = Math.floor(Date.now() / 1000);
    await db
      .prepare("INSERT INTO follows (id, follower_id, following_id, created_at) VALUES (?, ?, ?, ?)")
      .bind(followId, userId, targetUser.id, timestamp)
      .run();
  }

  return redirect(`/profile/${username}`);
}

export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}
