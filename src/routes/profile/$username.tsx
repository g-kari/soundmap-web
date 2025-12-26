import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { getEnvAsync, getDrizzle, schema } from "~/utils/db.server";

const getProfileFn = createServerFn({ method: "GET" }).handler(async ({ data, context }: { data: { username: string }; context: any }) => {
    const env = await getEnvAsync(context);

    if (!env.DATABASE) {
      console.error("DATABASE binding is not available");
      return { user: null, posts: [], followersCount: 0, followingCount: 0 };
    }

    const db = getDrizzle(env);

    const user = await db.query.users.findFirst({
      where: eq(schema.users.username, data.username),
      columns: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
      with: {
        posts: {
          orderBy: [desc(schema.posts.createdAt)],
        },
        followers: true,
        following: true,
      },
    });

    if (!user) {
      return { user: null, posts: [], followersCount: 0, followingCount: 0 };
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
      },
      posts: user.posts.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        audioUrl: p.audioUrl,
        latitude: p.latitude,
        longitude: p.longitude,
        location: p.location,
        createdAt: p.createdAt.toISOString(),
      })),
      followersCount: user.followers.length,
      followingCount: user.following.length,
    };
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
