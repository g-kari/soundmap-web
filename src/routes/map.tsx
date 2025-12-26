import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Suspense, lazy } from "react";
import { getEnvAsync } from "~/utils/db.server";

const MapComponent = lazy(() => import("~/components/Map"));

const getMapPostsFn = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const env = await getEnvAsync(context);
    
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

    // データ構造をMapコンポーネントの期待する形式に変換
    const posts = postsResult.results.map((post: any) => ({
      id: post.id,
      title: post.title,
      latitude: post.latitude,
      longitude: post.longitude,
      location: post.location,
      user: {
        username: post.username,
      },
    }));

    return { posts };
  }
);

export const Route = createFileRoute("/map")({
  loader: async ({ context }) => {
    return getMapPostsFn({ context });
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
