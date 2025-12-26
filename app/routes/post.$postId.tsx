import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { prisma } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

/**
 * Loads a single post by ID along with its author, likes, comments, and counts for rendering the post detail page.
 *
 * @returns A JSON object containing `post` (the post record including `user`, `likes`, `comments`, and `_count`), `currentUser` (the authenticated user or `null`), and `isLiked` (`true` if `currentUser` has liked the post, `false` otherwise).
 * @throws Response with status 404 when `postId` is missing or no matching post is found.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { postId } = params;
  const currentUser = await getUser(request);

  if (!postId) {
    throw new Response("Not Found", { status: 404 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      likes: true,
      comments: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  const isLiked = currentUser
    ? post.likes.some((like) => like.userId === currentUser.id)
    : false;

  return json({ post, currentUser, isLiked });
}

/**
 * Render the post detail page showing the author header, audio player, like controls, and comments.
 *
 * @returns A React element representing the post detail view populated from the route loader data
 */
export default function PostDetail() {
  const { post, currentUser, isLiked } = useLoaderData<typeof loader>();

  return (
    <div className="container">
      <div className="post-detail">
        <div className="post-header">
          <Link to={`/profile/${post.user.username}`} className="post-author">
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
                {new Date(post.createdAt).toLocaleDateString("ja-JP")}
              </div>
            </div>
          </Link>
        </div>

        <h1 className="post-title">{post.title}</h1>

        {post.description && (
          <p className="post-description">{post.description}</p>
        )}

        {post.location && (
          <div className="post-location">
            📍 {post.location}
          </div>
        )}

        <div className="audio-player">
          <audio controls src={post.audioUrl} className="audio-element">
            お使いのブラウザは音声再生に対応していません。
          </audio>
        </div>

        <div className="post-stats">
          <span>{post._count.likes} いいね</span>
          <span>{post._count.comments} コメント</span>
        </div>

        {currentUser && (
          <div className="post-actions">
            <Form method="post" action={`/post/${post.id}/like`}>
              <button
                type="submit"
                className={`button ${isLiked ? "button-liked" : "button-secondary"}`}
              >
                {isLiked ? "❤️ いいね済み" : "🤍 いいね"}
              </button>
            </Form>
          </div>
        )}

        <div className="comments-section">
          <h2 className="section-title">コメント</h2>

          {currentUser && (
            <Form method="post" action={`/post/${post.id}/comment`} className="comment-form">
              <textarea
                name="content"
                className="form-textarea"
                placeholder="コメントを入力..."
                required
              />
              <button type="submit" className="button button-primary">
                投稿
              </button>
            </Form>
          )}

          <div className="comments-list">
            {post.comments.map((comment) => (
              <div key={comment.id} className="comment">
                <Link to={`/profile/${comment.user.username}`} className="comment-author">
                  <div className="avatar-small">
                    {comment.user.avatarUrl ? (
                      <img src={comment.user.avatarUrl} alt={comment.user.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {comment.user.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="username">{comment.user.username}</span>
                </Link>
                <p className="comment-content">{comment.content}</p>
                <div className="comment-date">
                  {new Date(comment.createdAt).toLocaleDateString("ja-JP")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}