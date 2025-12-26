import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generateId, getCurrentTimestamp } from "~/utils/db.server";
import bcrypt from "bcryptjs";
import { createAndSetSession } from "~/utils/session";

import { getEnvAsync } from "~/utils/db.server";

const registerFn = createServerFn({ method: "POST" }).handler(async ({ data, context }: { data: { email: string; username: string; password: string }; context: any }) => {
    const { email, username, password } = data;
    const env = await getEnvAsync(context);
    
    if (!env.DATABASE) {
      return { error: "データベース接続が利用できません" };
    }
    
    const db = env.DATABASE;

    // Check if user exists
    const existingUser = await db
      .prepare("SELECT id FROM users WHERE email = ? OR username = ?")
      .bind(email, username)
      .first();

    if (existingUser) {
      return {
        error: "このメールアドレスまたはユーザー名は既に使用されています",
      };
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = generateId();
    const now = getCurrentTimestamp();

    await db
      .prepare(
        "INSERT INTO users (id, email, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(userId, email, username, passwordHash, now, now)
      .run();

    // Create session and set cookie after registration
    await createAndSetSession(env.SESSION_KV, {
      userId,
      username,
      email,
    });

    return { success: true, userId };
  });

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const result = await registerFn({ data: { email, username, password } });
      if (result.error) {
        setError(result.error);
      } else {
        navigate({ to: "/timeline" });
      }
    } catch (err) {
      setError("登録に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">新規登録</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              ユーザー名
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              minLength={8}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button
            type="submit"
            className="button button-primary button-full"
            disabled={isLoading}
          >
            {isLoading ? "登録中..." : "登録"}
          </button>
        </form>
        <p className="auth-footer">
          既にアカウントをお持ちの方は{" "}
          <Link to="/login" className="link">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
