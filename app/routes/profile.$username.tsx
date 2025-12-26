import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { prisma } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

/**
 * Load data required to render a user's profile page by username.
 *
 * Returns the profile user's public fields, their posts (ordered by creation date descending, with per-post like/comment counts),
 * aggregate counts (followers, following, posts), the currently authenticated user (if any), and whether the authenticated user follows the profile.
 *
 * @returns An object with:
 *  - `user`: profile fields (`id`, `username`, `email`, `bio`, `avatarUrl`, `createdAt`), `posts` (each with `_count` of `likes` and `comments`), and `_count` (followers, following, posts).
 *  - `currentUser`: the authenticated user object or `null`.
 *  - `isFollowing`: `true` if `currentUser` follows the profile user, `false` otherwise.
 *
 * @throws Response 404 if the `username` route parameter is missing or no matching user is found.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { username } = params;
  const currentUser = await getUser(request);

  if (!username) {
    throw new Response("Not Found", { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      posts: {
        include: {
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
      },
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });

  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  let isFollowing = false;
  if (currentUser) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  return json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      posts: user.posts,
      _count: user._count,
    },
    currentUser,
    isFollowing,
  });
}

/**
 * Renders a user's profile page with avatar, bio, statistics, follow action, and the user's posts.
 *
 * The component displays the user's avatar (or a placeholder using the first letter of the username), username, optional bio, and counts for posts, followers, and following. If a signed-in viewer is not viewing their own profile, a follow/unfollow form is shown reflecting the current following state. The posts section shows an empty message when there are no posts or a grid of post cards with title, optional description and location, like/comment counts, and a localized creation date.
 *
 * @returns The JSX element for the user's profile page.
 */
export default function Profile() {
  const { user, currentUser, isFollowing } = useLoaderData<typeof loader>();
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="container">
      <div className="profile-container">
        <div className="profile-header">
          <div className="avatar-large">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} />
            ) : (
              <div className="avatar-placeholder">
                {user.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1 className="profile-username">{user.username}</h1>
            {user.bio && <p className="profile-bio">{user.bio}</p>}
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">{user._count.posts}</span>
                <span className="stat-label">投稿</span>
              </div>
              <div className="stat">
                <span className="stat-value">{user._count.followers}</span>
                <span className="stat-label">フォロワー</span>
              </div>
              <div className="stat">
                <span className="stat-value">{user._count.following}</span>
                <span className="stat-label">フォロー中</span>
              </div>
            </div>
            {currentUser && !isOwnProfile && (
              <Form method="post" action={`/profile/${user.username}/follow`}>
                <button
                  type="submit"
                  className={`button ${isFollowing ? "button-secondary" : "button-primary"}`}
                >
                  {isFollowing ? "フォロー解除" : "フォローする"}
                </button>
              </Form>
            )}
          </div>
        </div>

        <div className="profile-posts">
          <h2 className="section-title">投稿</h2>
          {user.posts.length === 0 ? (
            <p className="empty-message">まだ投稿がありません</p>
          ) : (
            <div className="posts-grid">
              {user.posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="post-card"
                >
                  <h3 className="post-card-title">{post.title}</h3>
                  {post.description && (
                    <p className="post-card-description">{post.description}</p>
                  )}
                  {post.location && (
                    <div className="post-card-location">📍 {post.location}</div>
                  )}
                  <div className="post-card-stats">
                    <span>❤️ {post._count.likes}</span>
                    <span>💬 {post._count.comments}</span>
                  </div>
                  <div className="post-card-date">
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