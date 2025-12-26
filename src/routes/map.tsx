import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Suspense, lazy } from "react";
import { desc, isNotNull, and } from "drizzle-orm";
import { getEnvAsync, getDrizzle, schema } from "~/utils/db.server";

const MapComponent = lazy(() => import("~/components/Map"));

const getMapPostsFn = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const env = await getEnvAsync(context);

    if (!env.DATABASE) {
      console.error("DATABASE binding is not available");
      return { posts: [] };
    }

    const db = getDrizzle(env);

    const postsResult = await db.query.posts.findMany({
      where: and(
        isNotNull(schema.posts.latitude),
        isNotNull(schema.posts.longitude)
      ),
      with: {
        user: {
          columns: {
            username: true,
          },
        },
      },
      columns: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
        location: true,
      },
      orderBy: [desc(schema.posts.createdAt)],
      limit: 100,
    });

    // データ構造をMapコンポーネントの期待する形式に変換
    const posts = postsResult.map((post) => ({
      id: post.id,
      title: post.title,
      latitude: post.latitude,
      longitude: post.longitude,
      location: post.location,
      user: {
        username: post.user.username,
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
