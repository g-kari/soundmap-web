import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import bcrypt from "bcryptjs";
import { createAndSetSession } from "~/utils/session";

import { getEnvAsync } from "~/utils/db.server";

const loginFn = createServerFn({ method: "POST" }).handler(async ({ data, context }: { data: { email: string; password: string }; context: any }) => {
    const { email, password } = data;
    const env = await getEnvAsync(context);

    if (!env.DATABASE) {
      return { error: "データベース接続が利用できません" };
    }
    
    const db = env.DATABASE;

    const user = await db
      .prepare(
        "SELECT id, email, password_hash, username FROM users WHERE email = ?"
      )
      .bind(email)
      .first();

    if (!user) {
      return { error: "メールアドレスまたはパスワードが間違っています" };
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return { error: "メールアドレスまたはパスワードが間違っています" };
    }

    // Create session and set cookie
    await createAndSetSession(env.SESSION_KV, {
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return { success: true, userId: user.id };
  });

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const searchParams = Route.useSearch();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await loginFn({ data: { email, password } });
      if (result.error) {
        setError(result.error);
      } else {
        navigate({ to: "/timeline" });
      }
    } catch (err) {
      setError("ログインに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">ログイン</h1>
        <form onSubmit={handleSubmit} className="auth-form">
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
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button
            type="submit"
            className="button button-primary button-full"
            disabled={isLoading}
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
        <p className="auth-footer">
          アカウントをお持ちでない方は{" "}
          <Link to="/register" className="link">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
