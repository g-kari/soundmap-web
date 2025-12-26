import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

/**
 * Toggle the authenticated user's like on the post specified by the route `postId`, then redirect to that post.
 *
 * Throws a 404 Response when `postId` is not present in route parameters.
 *
 * @returns A redirect Response to `/post/{postId}` after the like has been created or deleted
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const { postId } = params;

  if (!postId) {
    throw new Response("Not Found", { status: 404 });
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });
  } else {
    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });
  }

  return redirect(`/post/${postId}`);
}

/**
 * Rejects requests with HTTP 405 Method Not Allowed.
 *
 * @returns A Response with status 405 and body "Method Not Allowed"
 */
export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}