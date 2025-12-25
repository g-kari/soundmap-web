import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

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

export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}
