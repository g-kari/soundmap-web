import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

/**
 * Toggle the follow relationship between the authenticated user and the user identified by the route `username`.
 *
 * @param params - Route params; `params.username` is the target user's username.
 * @returns A redirect `Response` to `/profile/{username}` after toggling follow state.
 * @throws {Response} 404 if `username` is missing or the target user does not exist.
 * @throws {Response} 400 if the authenticated user attempts to follow themselves.
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const { username } = params;

  if (!username) {
    throw new Response("Not Found", { status: 404 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!targetUser) {
    throw new Response("Not Found", { status: 404 });
  }

  if (targetUser.id === userId) {
    throw new Response("Cannot follow yourself", { status: 400 });
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: userId,
        followingId: targetUser.id,
      },
    },
  });

  if (existingFollow) {
    await prisma.follow.delete({
      where: {
        id: existingFollow.id,
      },
    });
  } else {
    await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: targetUser.id,
      },
    });
  }

  return redirect(`/profile/${username}`);
}

/**
 * Responds to loader requests with an HTTP 405 indicating the method is not allowed.
 *
 * @returns A Response with status 405 and body "Method Not Allowed".
 */
export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}