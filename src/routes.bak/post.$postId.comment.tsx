import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { redirect, json } from "@remix-run/cloudflare";
import { getDB, generateId } from "~/utils/db.server.cloudflare";
import { requireUserId } from "~/utils/session.server.cloudflare";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const userId = await requireUserId(request, context);
  const { postId } = params;

  if (!postId) {
    throw new Response("Not Found", { status: 404 });
  }

  const formData = await request.formData();
  const content = formData.get("content");

  if (typeof content !== "string" || content.trim().length === 0) {
    return json(
      { error: "コメント内容を入力してください" },
      { status: 400 }
    );
  }

  const db = getDB(context);
  const commentId = generateId();
  const timestamp = Math.floor(Date.now() / 1000);

  await db
    .prepare("INSERT INTO comments (id, user_id, post_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(commentId, userId, postId, content, timestamp, timestamp)
    .run();

  return redirect(`/post/${postId}`);
}

export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}
