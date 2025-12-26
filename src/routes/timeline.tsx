import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";
import { getEnvAsync, getDrizzle, schema } from "~/utils/db.server";

const getTimelineFn = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const env = await getEnvAsync(context);

    if (!env.DATABASE) {
      console.error("DATABASE binding is not available");
      return { posts: [] };
    }

    const db = getDrizzle(env);

    // Get posts with user, likes, and comments using relational query
    const postsResult = await db.query.posts.findMany({
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        likes: true,
        comments: true,
      },
      orderBy: [desc(schema.posts.createdAt)],
      limit: 50,
    });

    const posts = postsResult.map((p) => ({
      id: p.id,
      userId: p.userId,
      title: p.title,
      description: p.description,
      audioUrl: p.audioUrl,
      latitude: p.latitude,
      longitude: p.longitude,
      location: p.location,
      createdAt: p.createdAt.toISOString(),
      user: {
        id: p.user.id,
        username: p.user.username,
        avatarUrl: p.user.avatarUrl,
      },
      _count: {
        likes: p.likes.length,
        comments: p.comments.length,
      },
    }));

    return { posts };
  }
);

export const Route = createFileRoute("/timeline")({
  loader: async () => {
    return getTimelineFn();
  },
  component: Timeline,
});

function Timeline() {
  const { posts } = Route.useLoaderData();

  return (
    <div className="container">
      <div className="timeline-container">
        <h1 className="page-title">タイムライン</h1>

        {posts.length === 0 ? (
          <div className="empty-state">
            <p className="empty-message">まだ投稿がありません。</p>
            <p className="empty-hint">
              他のユーザーをフォローするか、自分で投稿してみましょう！
            </p>
            <div className="empty-actions">
              <Link to="/post/new" className="button button-primary">
                投稿する
              </Link>
            </div>
          </div>
        ) : (
          <div className="timeline-posts">
            {posts.map((post: any) => (
              <div key={post.id} className="timeline-post">
                <div className="post-header">
                  <Link
                    to="/profile/$username"
                    params={{ username: post.user.username }}
                    className="post-author"
                  >
                    <div className="avatar">
                      {post.user.avatarUrl ? (
                        <img src={post.user.avatarUrl} alt={post.user.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {post.user.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="username">{post.user.username}</div>
                      <div className="post-date">
                        {new Date(post.createdAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </Link>
                </div>

                <Link to="/post/$postId" params={{ postId: post.id }} className="post-content">
                  <h2 className="post-title">{post.title}</h2>
                  {post.description && (
                    <p className="post-description">{post.description}</p>
                  )}
                  {post.location && (
                    <div className="post-location">{post.location}</div>
                  )}
                </Link>

                <div className="audio-player-small">
                  <audio
                    controls
                    src={post.audioUrl}
                    className="audio-element"
                    preload="metadata"
                  >
                    お使いのブラウザは音声再生に対応していません。
                  </audio>
                </div>

                <div className="post-stats">
                  <Link to="/post/$postId" params={{ postId: post.id }} className="stat-link">
                    {post._count.likes} いいね
                  </Link>
                  <Link to="/post/$postId" params={{ postId: post.id }} className="stat-link">
                    {post._count.comments} コメント
                  </Link>
                </div>

                <div className="post-actions">
                  <Link to="/post/$postId" params={{ postId: post.id }} className="button button-secondary">
                    詳細を見る
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
