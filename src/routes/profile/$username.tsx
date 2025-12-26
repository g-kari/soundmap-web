import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getProfileFn = createServerFn({ method: "GET" })
  .validator((data: { username: string }) => data)
  .handler(async ({ data, context }) => {
    try {
      const db = (context as any).cloudflare?.env?.DATABASE;
      if (!db) {
        console.error("Database not available");
        return { user: null, posts: [], followersCount: 0, followingCount: 0, error: "Database not available" };
      }

      const user = await db
        .prepare(
          `SELECT id, username, avatar_url as avatarUrl, bio, created_at as createdAt
           FROM users WHERE username = ?`
        )
        .bind(data.username)
        .first();

      if (!user) {
        return { user: null, posts: [], followersCount: 0, followingCount: 0 };
      }

      const userData = user as any;

      const postsResult = await db
        .prepare(
          `SELECT
            id, title, description, audio_url as audioUrl,
            latitude, longitude, location, created_at as createdAt
          FROM posts WHERE user_id = ? ORDER BY created_at DESC`
        )
        .bind(userData.id)
        .all();

      const followersCount = await db
        .prepare("SELECT COUNT(*) as count FROM follows WHERE following_id = ?")
        .bind(userData.id)
        .first();

      const followingCount = await db
        .prepare("SELECT COUNT(*) as count FROM follows WHERE follower_id = ?")
        .bind(userData.id)
        .first();

      const posts = postsResult?.results || [];

      return {
        user: {
          ...userData,
          createdAt: userData.createdAt ? new Date(userData.createdAt * 1000).toISOString() : new Date().toISOString(),
        },
        posts: posts.map((p: any) => ({
          ...p,
          createdAt: p.createdAt ? new Date(p.createdAt * 1000).toISOString() : new Date().toISOString(),
        })),
        followersCount: (followersCount as any)?.count || 0,
        followingCount: (followingCount as any)?.count || 0,
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return { user: null, posts: [], followersCount: 0, followingCount: 0, error: "Failed to fetch profile" };
    }
  });

export const Route = createFileRoute("/profile/$username")({
  loader: async ({ params }) => {
    return getProfileFn({ data: { username: params.username } });
  },
  component: Profile,
});

function Profile() {
  const { user, posts, followersCount, followingCount } = Route.useLoaderData();

  if (!user) {
    return (
      <div className="container">
        <div className="error-state">
          <h1>ユーザーが見つかりません</h1>
          <Link to="/" className="button button-primary">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="profile-page">
        <div className="profile-header">
          <div className="avatar avatar-large">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} />
            ) : (
              <div className="avatar-placeholder">
                {user.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="profile-username">{user.username}</h1>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <div className="profile-stats">
            <span>{posts.length} 投稿</span>
            <span>{followersCount} フォロワー</span>
            <span>{followingCount} フォロー中</span>
          </div>
        </div>

        <div className="profile-posts">
          <h2>投稿一覧</h2>
          {posts.length === 0 ? (
            <p className="no-posts">まだ投稿がありません</p>
          ) : (
            <div className="posts-grid">
              {posts.map((post: any) => (
                <Link
                  key={post.id}
                  to="/post/$postId"
                  params={{ postId: post.id }}
                  className="post-card"
                >
                  <h3 className="post-title">{post.title}</h3>
                  {post.description && (
                    <p className="post-description">{post.description}</p>
                  )}
                  <div className="post-date">
                    {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
