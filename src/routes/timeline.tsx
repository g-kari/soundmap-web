import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getEnvAsync } from "~/utils/db.server";
import { useEffect, useRef, useState, useCallback } from "react";

const getTimelineFn = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const env = await getEnvAsync(context);
    
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

function PostCard({ post }: { post: any }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  // 自動再生のためのIntersection Observer
  useEffect(() => {
    const card = cardRef.current;
    const audio = audioRef.current;
    if (!card || !audio) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            // 70%以上表示されたら再生
            audio.play().catch(() => {
              // 自動再生がブロックされた場合は何もしない
            });
          } else {
            // 画面外に出たら停止
            audio.pause();
          }
        });
      },
      {
        threshold: [0.7],
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // 音声の再生状態を監視
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [isPlaying]);

  const togglePlayer = useCallback(() => {
    setShowPlayer((prev) => !prev);
  }, []);

  return (
    <div ref={cardRef} className="timeline-post">
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
                month: "short",
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

        {/* スピーカーアイコン */}
        <div
          className={`audio-indicator ${isPlaying ? "playing" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePlay();
          }}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 8a5 5 0 0 1 0 8" />
              <path d="M17.7 5a9 9 0 0 1 0 14" />
              <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a0.8 0.8 0 0 1 1.5 .5v14a0.8 0.8 0 0 1 -1.5 .5l-3.5 -4.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a0.8 0.8 0 0 1 1.5 .5v14a0.8 0.8 0 0 1 -1.5 .5l-3.5 -4.5" />
              <path d="M16 10l4 4m0 -4l-4 4" />
            </svg>
          )}
        </div>
      </Link>

      {/* 非表示の音声要素 */}
      <audio
        ref={audioRef}
        src={post.audioUrl}
        preload="metadata"
      />

      {showPlayer && (
        <div className="audio-player-visible">
          <audio
            controls
            src={post.audioUrl}
            className="audio-element"
          />
        </div>
      )}

      <div className="post-stats">
        <Link to="/post/$postId" params={{ postId: post.id }} className="stat-link">
          ♥ {post._count.likes}
        </Link>
        <Link to="/post/$postId" params={{ postId: post.id }} className="stat-link">
          💬 {post._count.comments}
        </Link>
        {post.location && (
          <span className="post-location-badge">📍 {post.location}</span>
        )}
        <button
          type="button"
          className="player-toggle"
          onClick={togglePlayer}
        >
          {showPlayer ? "▲" : "▼"} プレイヤー
        </button>
      </div>
    </div>
  );
}

function Timeline() {
  const { posts } = Route.useLoaderData();

  return (
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
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
