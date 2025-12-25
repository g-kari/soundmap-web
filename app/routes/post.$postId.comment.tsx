import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

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

export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}
