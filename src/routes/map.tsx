import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Suspense, lazy } from "react";
import { getEnv } from "~/utils/db.server";

const MapComponent = lazy(() => import("~/components/Map"));

const getMapPostsFn = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const env = getEnv(context);
    
    if (!env.DATABASE) {
      console.error("DATABASE binding is not available");
      return { posts: [] };
    }
    
    const db = env.DATABASE;

    const postsResult = await db
      .prepare(`
        SELECT
          p.id,
          p.title,
          p.description,
          p.audio_url as audioUrl,
          p.latitude,
          p.longitude,
          p.location,
          u.username
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        ORDER BY p.created_at DESC
        LIMIT 100
      `)
      .all();

    return { posts: postsResult.results };
  }
);

export const Route = createFileRoute("/map")({
  loader: async () => {
    return getMapPostsFn();
  },
  component: MapPage,
});

function MapPage() {
  const { posts } = Route.useLoaderData();

  return (
    <div className="map-container">
      <Suspense fallback={<div className="map-loading">地図を読み込み中...</div>}>
        <MapComponent posts={posts} />
      </Suspense>
    </div>
  );
}
