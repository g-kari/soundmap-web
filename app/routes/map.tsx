import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import Map from "~/components/Map";
import ClientOnly from "~/components/ClientOnly";

/**
 * Enforces authentication and loads posts with each author's username, ordered newest first.
 *
 * Enforces authentication for the incoming request (may redirect or otherwise short-circuit unauthenticated requests).
 *
 * @returns A JSON response containing `posts`, an array of posts where each post includes its related user's `username` and is ordered by `createdAt` descending.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const posts = await prisma.post.findMany({
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return json({ posts });
}

/**
 * Render the "サウンドマップ" page and mount a client-only Map component populated with loader-provided posts.
 *
 * @returns The page's React element containing the title and a ClientOnly-wrapped Map rendered with `posts`.
 */
export default function MapPage() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <div className="container">
      <h1 className="page-title">サウンドマップ</h1>
      <div className="map-container">
        <ClientOnly fallback={<div>地図を読み込んでいます...</div>}>
          {() => <Map posts={posts} />}
        </ClientOnly>
      </div>
    </div>
  );
}