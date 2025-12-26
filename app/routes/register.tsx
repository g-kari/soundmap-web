import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useActionData } from "@remix-run/react";
import { register } from "~/utils/auth.server.cloudflare";
import { createUserSession, getUserId } from "~/utils/session.server.cloudflare";
import { getDB } from "~/utils/db.server.cloudflare";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/timeline");
  return json({});
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const username = formData.get("username");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return json(
      { error: "入力内容が正しくありません" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return json(
      { error: "パスワードは6文字以上である必要があります" },
      { status: 400 }
    );
  }

  const db = getDB(context);
  const existingUser = await db
    .prepare("SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1")
    .bind(email, username)
    .first();

  if (existingUser) {
    return json(
      { error: "そのメールアドレスまたはユーザー名は既に使用されています" },
      { status: 400 }
    );
  }

  const user = await register({ email, username, password }, context);

  return createUserSession(user.id, "/timeline", context);
}

export default function Register() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">新規登録</h1>
        <Form method="post" className="auth-form">
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
            <label htmlFor="password" className="form-label">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              minLength={6}
              required
            />
          </div>
          {actionData?.error && (
            <div className="error-message">{actionData.error}</div>
          )}
          <button type="submit" className="button button-primary button-full">
            登録
          </button>
        </Form>
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
