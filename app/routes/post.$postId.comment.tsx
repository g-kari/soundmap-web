import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

/**
 * Handle creation of a comment for the post identified by the route parameter.
 *
 * Validates the authenticated user, ensures `postId` exists, validates the submitted `content`,
 * creates a new comment record, and redirects back to the post on success.
 *
 * @param params - Route parameters; `params.postId` is the target post's identifier.
 * @returns A Response that redirects to `/post/{postId}` on success, a 400 JSON response with an error message when `content` is empty, or a 404 Response if `postId` is missing.
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
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

  await prisma.comment.create({
    data: {
      userId,
      postId,
      content,
    },
  });

  return redirect(`/post/${postId}`);
}

/**
 * Rejects requests to this route with HTTP 405 Method Not Allowed.
 *
 * @returns A Response with status 405 and body "Method Not Allowed".
 */
export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}