import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generateId, getCurrentTimestamp } from "~/utils/db.server";

const createPostFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      title: string;
      description?: string;
      latitude?: number;
      longitude?: number;
      location?: string;
    }) => data
  )
  .handler(async ({ data, context }) => {
    const db = (context as any).cloudflare.env.DATABASE;

    const postId = generateId();
    const now = getCurrentTimestamp();

    // TODO: Get userId from session
    const userId = "test-user-id";

    await db
      .prepare(
        `INSERT INTO posts (id, user_id, title, description, latitude, longitude, location, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        postId,
        userId,
        data.title,
        data.description || null,
        data.latitude || null,
        data.longitude || null,
        data.location || null,
        now,
        now
      )
      .run();

    return { success: true, postId };
  });

export const Route = createFileRoute("/post/new")({
  component: NewPost,
});

function NewPost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await createPostFn({
        data: { title, description, location },
      });
      if (result.success) {
        navigate({ to: "/timeline" });
      }
    } catch (err) {
      setError("投稿に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="post-form-container">
        <h1 className="page-title">新規投稿</h1>
        <form onSubmit={handleSubmit} className="post-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              タイトル
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="form-group">
            <label htmlFor="location" className="form-label">
              場所
            </label>
            <input
              type="text"
              id="location"
              name="location"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button
            type="submit"
            className="button button-primary"
            disabled={isLoading}
          >
            {isLoading ? "投稿中..." : "投稿する"}
          </button>
        </form>
      </div>
    </div>
  );
}
