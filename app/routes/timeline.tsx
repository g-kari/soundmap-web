import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

/**
 * Loads timeline posts for the authenticated user, including posts from users they follow and their own.
 *
 * Retrieves up to 50 most recent posts authored by the authenticated user and users they follow, including each post's author info (id, username, avatarUrl) and counts for likes and comments.
 *
 * @returns An object with `posts` — an array of post records (each including `user` and `_count` for `likes` and `comments`) — and `userId` — the authenticated user's ID.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // フォローしているユーザーのIDを取得
  const following = await prisma.follow.findMany({
    where: {
      followerId: userId,
    },
    select: {
      followingId: true,
    },
  });

  const followingIds = following.map((f) => f.followingId);

  // 自分の投稿も含める
  followingIds.push(userId);

  // フォローしているユーザー（と自分）の投稿を取得
  const posts = await prisma.post.findMany({
    where: {
      userId: {
        in: followingIds,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // 最新50件
  });

  return json({ posts, userId });
}

/**
 * Renders the timeline page showing recent posts from the current user and users they follow.
 *
 * Displays an empty-state prompt when there are no posts; otherwise renders each post with author info, localized date, title, optional description and location, an audio player, like/comment counts, and links to post and profile pages.
 *
 * @returns The timeline page React element that presents posts or an empty-state prompt to create or discover posts
 */
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
            {posts.map((post) => (
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