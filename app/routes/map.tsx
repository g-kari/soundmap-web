import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getDB } from "~/utils/db.server.cloudflare";
import { requireUserId } from "~/utils/session.server.cloudflare";
import Map from "~/components/Map";
import ClientOnly from "~/components/ClientOnly";

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireUserId(request, context);
  const db = getDB(context);

  const posts = await db
    .prepare(`
      SELECT
        p.id,
        p.title,
        p.latitude,
        p.longitude,
        p.location,
        u.username
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `)
    .all();

  return json({ posts: posts.results });
}

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
