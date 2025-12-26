import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { getDB, generateId } from "~/utils/db.server.cloudflare";
import { requireUserId } from "~/utils/session.server.cloudflare";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const userId = await requireUserId(request, context);
  const { postId } = params;

  if (!postId) {
    throw new Response("Not Found", { status: 404 });
  }

  const db = getDB(context);

  const existingLike = await db
    .prepare("SELECT id FROM likes WHERE user_id = ? AND post_id = ?")
    .bind(userId, postId)
    .first();

  if (existingLike) {
    await db
      .prepare("DELETE FROM likes WHERE id = ?")
      .bind(existingLike.id)
      .run();
  } else {
    const likeId = generateId();
    const timestamp = Math.floor(Date.now() / 1000);
    await db
      .prepare("INSERT INTO likes (id, user_id, post_id, created_at) VALUES (?, ?, ?, ?)")
      .bind(likeId, userId, postId, timestamp)
      .run();
  }

  return redirect(`/post/${postId}`);
}

export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}
