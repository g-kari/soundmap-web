import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { getDB } from "~/utils/db.server.cloudflare";
import { requireUserId } from "~/utils/session.server.cloudflare";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await requireUserId(request, context);
  const db = getDB(context);

  // Get following user IDs
  const followingResult = await db
    .prepare("SELECT following_id FROM follows WHERE follower_id = ?")
    .bind(userId)
    .all();

  const followingIds = followingResult.results.map((f: any) => f.following_id);
  followingIds.push(userId); // Include own posts

  // Build IN clause
  const placeholders = followingIds.map(() => "?").join(",");

  // Get posts from followed users
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
      WHERE p.user_id IN (${placeholders})
      ORDER BY p.created_at DESC
      LIMIT 50
    `)
    .bind(...followingIds)
    .all();

  // Transform results to match expected structure
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

  return json({ posts, userId });
}

export default function Timeline() {
  const { posts, userId } = useLoaderData<typeof loader>();

  return (
    <div className="container">
      <div className="timeline-container">
        <h1 className="page-title">タイムライン</h1>

        {posts.length === 0 ? (
          <div className="empty-state">
            <p className="empty-message">
              まだ投稿がありません。
            </p>
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
                    to={`/profile/${post.user.username}`}
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

                <Link to={`/post/${post.id}`} className="post-content">
                  <h2 className="post-title">{post.title}</h2>
                  {post.description && (
                    <p className="post-description">{post.description}</p>
                  )}
                  {post.location && (
                    <div className="post-location">📍 {post.location}</div>
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
                  <Link to={`/post/${post.id}`} className="stat-link">
                    ❤️ {post._count.likes} いいね
                  </Link>
                  <Link to={`/post/${post.id}`} className="stat-link">
                    💬 {post._count.comments} コメント
                  </Link>
                </div>

                <div className="post-actions">
                  <Link to={`/post/${post.id}`} className="button button-secondary">
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
