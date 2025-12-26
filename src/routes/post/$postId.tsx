import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getEnv } from "~/utils/db.server";

const getPostFn = createServerFn({ method: "GET" }).handler(async ({ data, context }: { data: { postId: string }; context: any }) => {
    const env = getEnv(context);
    
    if (!env.DATABASE) {
      console.error("DATABASE binding is not available");
      return { post: null, comments: [] };
    }
    
    const db = env.DATABASE;

    const post = await db
      .prepare(
        `SELECT
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
          u.avatar_url as user_avatarUrl
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?`
      )
      .bind(data.postId)
      .first();

    if (!post) {
      return { post: null, comments: [], likesCount: 0 };
    }

    const commentsResult = await db
      .prepare(
        `SELECT
          c.id,
          c.content,
          c.created_at as createdAt,
          u.username,
          u.avatar_url as avatarUrl
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at DESC`
      )
      .bind(data.postId)
      .all();

    const likesCount = await db
      .prepare("SELECT COUNT(*) as count FROM likes WHERE post_id = ?")
      .bind(data.postId)
      .first();

    return {
      post: {
        ...post,
        createdAt: new Date((post as any).createdAt * 1000).toISOString(),
        user: {
          id: (post as any).user_id,
          username: (post as any).user_username,
          avatarUrl: (post as any).user_avatarUrl,
        },
      },
      comments: commentsResult.results.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt * 1000).toISOString(),
      })),
      likesCount: (likesCount as any)?.count || 0,
    };
  });

export const Route = createFileRoute("/post/$postId")({
  loader: async ({ params }) => {
    return getPostFn({ data: { postId: params.postId } });
  },
  component: PostDetail,
});

function PostDetail() {
  const { post, comments, likesCount } = Route.useLoaderData();

  if (!post) {
    return (
      <div className="container">
        <div className="error-state">
          <h1>投稿が見つかりません</h1>
          <Link to="/timeline" className="button button-primary">
            タイムラインに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="post-detail">
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

        <h1 className="post-title">{post.title}</h1>
        {post.description && (
          <p className="post-description">{post.description}</p>
        )}
        {post.location && <div className="post-location">{post.location}</div>}

        {post.audioUrl && (
          <div className="audio-player">
            <audio controls src={post.audioUrl} className="audio-element">
              お使いのブラウザは音声再生に対応していません。
            </audio>
          </div>
        )}

        <div className="post-stats">
          <span>{likesCount} いいね</span>
          <span>{comments.length} コメント</span>
        </div>

        <div className="comments-section">
          <h2>コメント</h2>
          {comments.length === 0 ? (
            <p className="no-comments">まだコメントがありません</p>
          ) : (
            <div className="comments-list">
              {comments.map((comment: any) => (
                <div key={comment.id} className="comment">
                  <div className="comment-author">
                    <span className="username">{comment.username}</span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
