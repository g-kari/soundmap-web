import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getEnv } from "~/utils/db.server";

const getTimelineFn = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const env = getEnv(context);
    
    if (!env.DATABASE) {
      console.error("DATABASE binding is not available");
      return { posts: [] };
    }
    
    const db = env.DATABASE;

    // Get posts from all users for now
    const postsResult = await db
      .prepare(`
        SELECT
          p.id,
          p.user_id as userId,
          p.title,
          p.description,
          p.audio_url as audioUrl,
          p.latitude,
          p.longitude,
          p.location,
          p.created_at as createdAt,
          u.id as user_id,
          u.username as user_username,
          u.avatar_url as user_avatarUrl,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 50
      `)
      .all();

    const posts = postsResult.results.map((p: any) => ({
      id: p.id,
      userId: p.userId,
      title: p.title,
      description: p.description,
      audioUrl: p.audioUrl,
      latitude: p.latitude,
      longitude: p.longitude,
      location: p.location,
      createdAt: new Date(p.createdAt * 1000).toISOString(),
      user: {
        id: p.user_id,
        username: p.user_username,
        avatarUrl: p.user_avatarUrl,
      },
      _count: {
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
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
