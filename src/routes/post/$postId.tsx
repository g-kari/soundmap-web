import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { getEnvAsync, getDrizzle, schema } from "~/utils/db.server";

const getPostFn = createServerFn({ method: "GET" }).handler(async ({ data, context }: { data: { postId: string }; context: any }) => {
    const env = await getEnvAsync(context);

    if (!env.DATABASE) {
      console.error("DATABASE binding is not available");
      return { post: null, comments: [], likesCount: 0 };
    }

    const db = getDrizzle(env);

    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, data.postId),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        likes: true,
        comments: {
          with: {
            user: {
              columns: {
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: [desc(schema.comments.createdAt)],
        },
      },
    });

    if (!post) {
      return { post: null, comments: [], likesCount: 0 };
    }

    return {
      post: {
        id: post.id,
        userId: post.userId,
        title: post.title,
        description: post.description,
        audioUrl: post.audioUrl,
        latitude: post.latitude,
        longitude: post.longitude,
        location: post.location,
        createdAt: post.createdAt.toISOString(),
        user: {
          id: post.user.id,
          username: post.user.username,
          avatarUrl: post.user.avatarUrl,
        },
      },
      comments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        username: c.user.username,
        avatarUrl: c.user.avatarUrl,
      })),
      likesCount: post.likes.length,
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
